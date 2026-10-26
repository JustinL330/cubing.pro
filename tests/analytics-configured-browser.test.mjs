// Run against a production build configured with a synthetic GA4 ID and a
// disposable HTTPS origin. The Google tag is intercepted: no data reaches Google.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { test } from "node:test";
import { chromium } from "playwright";

const origin = "https://127.0.0.1:3443";
const consentKey = "cubing_pro_analytics_consent_v1";
const id = "G-TESTONLY123";

function startHttpsProxy() {
  const server = createHttpsServer({
    key: readFileSync(process.env.TEST_TLS_KEY ?? "/tmp/ga4-test-key.pem"),
    cert: readFileSync(process.env.TEST_TLS_CERT ?? "/tmp/ga4-test-cert.pem"),
  }, (request, response) => {
    const upstream = httpRequest({
      hostname: "127.0.0.1",
      port: 3000,
      path: request.url,
      method: request.method,
      headers: { ...request.headers, host: "127.0.0.1:3000" },
    }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    });
    upstream.on("error", (error) => {
      if (!response.headersSent) response.writeHead(502);
      response.end(String(error));
    });
    request.pipe(upstream);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(3443, "127.0.0.1", () => resolve(server));
  });
}

function pageViews(rows) {
  return rows.filter((entry) => entry[0] === "event" && entry[1] === "page_view");
}

test("configured GA4 respects consent and sanitizes page views", { timeout: 180000 }, async () => {
  const server = await startHttpsProxy();
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const googleRequests = [];
    await context.route(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?/, async (route) => {
      googleRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "application/javascript", body: "/* isolated test: no network analytics */" });
    });
    await context.route(/https:\/\/(?:www\.)?(?:google-analytics|analytics\.google)\.com\//, (route) => {
      throw new Error(`Unexpected analytics collection request: ${route.request().url()}`);
    });
    await context.addInitScript(() => localStorage.setItem("cubing_pro_locale", "en-US"));
    const page = await context.newPage();

    await page.goto(`${origin}/timer/?email=private%40example.com`, {
      waitUntil: "domcontentloaded", timeout: 120000,
    });
    await page.getByRole("button", { name: "Allow analytics" }).waitFor({ timeout: 60000 });
    assert.equal(googleRequests.length, 0, "must not load Google before opt-in");
    assert.equal(await page.locator('script[data-cubing-analytics="true"]').count(), 0);

    await page.getByRole("button", { name: "Allow analytics" }).click();
    await page.waitForFunction(() => (window.dataLayer ?? []).some((row) => row[0] === "event" && row[1] === "page_view"));
    const rows = await page.evaluate(() => window.dataLayer ?? []);
    assert.equal(googleRequests.length, 1, "one Google script load after opt-in");
    assert.equal(rows.find((row) => row[0] === "config")?.[2]?.send_page_view, false);
    assert.equal(pageViews(rows).length, 1, "exactly one initial page view");
    assert.deepEqual(pageViews(rows)[0][2], {
      page_location: `${origin}/timer`,
      page_referrer: "",
      page_title: "Cubing Pro",
      send_to: id,
    });
    assert.equal(rows.find((row) => row[0] === "consent" && row[1] === "update")?.[2]?.analytics_storage, "granted");

    // Next.js App Router integrates native History API changes with usePathname.
    // Route transitions should generate one sanitized PV per new public path.
    await page.evaluate(() => history.pushState({}, "", "/algs/?secret=not-for-ga"));
    await page.waitForFunction(() => (window.dataLayer ?? []).filter((row) => row[0] === "event" && row[1] === "page_view").length === 2);
    let spaViews = pageViews(await page.evaluate(() => window.dataLayer ?? []));
    assert.equal(spaViews[1][2].page_location, `${origin}/algs`);

    await page.evaluate(() => history.pushState({}, "", "/algs/?secret=another"));
    await page.waitForTimeout(350);
    assert.equal(pageViews(await page.evaluate(() => window.dataLayer ?? [])).length, 2, "query-only navigation must not double count");

    // Entering a sensitive route must unload a tag already injected on the
    // previous public route. Merely sending consent=denied is not sufficient:
    // a live Google script can retain its own History API listeners.
    await Promise.all([
      page.waitForEvent("load", { timeout: 120000 }),
      page.evaluate(() => history.pushState({}, "", "/settings/?private_token=hidden")),
    ]);
    assert.equal(pageViews(await page.evaluate(() => window.dataLayer ?? [])).length, 0);
    assert.equal(await page.locator('script[data-cubing-analytics="true"]').count(), 0);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), consentKey), "granted");

    await page.evaluate(() => history.pushState({}, "", "/timer/?secret=back"));
    await page.waitForFunction(() => (window.dataLayer ?? []).filter((row) => row[0] === "event" && row[1] === "page_view").length === 1);
    spaViews = pageViews(await page.evaluate(() => window.dataLayer ?? []));
    assert.equal(spaViews[0][2].page_location, `${origin}/timer`);
    assert.ok(spaViews.every((view) => !JSON.stringify(view).includes("secret=")));

    // Full reload must count one new view, not an automatic+manual double hit.
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForFunction(() => (window.dataLayer ?? []).some((row) => row[0] === "event" && row[1] === "page_view"));
    assert.equal(pageViews(await page.evaluate(() => window.dataLayer ?? [])).length, 1);

    // Revocation from another tab must immediately unload the active tag.
    // No Google script or collection request may appear on the reloaded tab.
    const settingsTab = await context.newPage();
    await settingsTab.goto(`${origin}/settings/?private_token=never-send`, {
      waitUntil: "domcontentloaded", timeout: 120000,
    });
    await settingsTab.getByRole("button", { name: "Decline analytics" }).waitFor({ timeout: 60000 });
    assert.equal(await settingsTab.locator('script[data-cubing-analytics="true"]').count(), 0);
    const beforeRevoke = googleRequests.length;
    await Promise.all([
      page.waitForEvent("load", { timeout: 120000 }),
      settingsTab.getByRole("button", { name: "Decline analytics" }).click(),
    ]);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), consentKey), "denied");
    assert.equal(await page.locator('script[data-cubing-analytics="true"]').count(), 0);
    assert.equal(await page.evaluate(() => window.dataLayer?.length ?? 0), 0);
    assert.equal(googleRequests.length, beforeRevoke, "revocation must not reload Google");
    await settingsTab.close();

    // A rejected visitor must remain untracked on subsequent public navigations.
    await page.goto(`${origin}/algs/?wca_id=private`, {
      waitUntil: "domcontentloaded", timeout: 120000,
    });
    await page.waitForTimeout(500);
    assert.equal(googleRequests.length, beforeRevoke);
    assert.equal(await page.locator('script[data-cubing-analytics="true"]').count(), 0);
    assert.equal(await page.evaluate(() => window.dataLayer?.length ?? 0), 0);
    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
