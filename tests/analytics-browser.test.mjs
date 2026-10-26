// Production-build privacy regression: an unconfigured fork must never load GA4,
// even if a browser has a previously stored "granted" consent value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const consentKey = "cubing_pro_analytics_consent_v1";
const googleRequest = /(?:googletagmanager\.com\/gtag\/js|google-analytics\.com|analytics\.google\.com)/i;

test("production build without GA4 configuration loads no tracking for any stored consent", { timeout: 180000 }, async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    for (const storedConsent of ["unset", "denied", "granted"]) {
      const context = await browser.newContext();
      const requests = [];
      context.on("request", (request) => {
        if (googleRequest.test(request.url())) requests.push(request.url());
      });
      try {
        await context.addInitScript(({ key, consent }) => {
          localStorage.setItem("cubing_pro_locale", "en-US");
          if (consent !== "unset") localStorage.setItem(key, consent);
        }, { key: consentKey, consent: storedConsent });

        const page = await context.newPage();
        const timerResponse = await page.goto(`${baseUrl}/timer/?private_query=do-not-send`, {
          waitUntil: "domcontentloaded", timeout: 120000,
        });
        assert.equal(timerResponse?.status(), 200, "timer route should work without analytics");

        const settingsResponse = await page.goto(`${baseUrl}/settings/`, {
          waitUntil: "domcontentloaded", timeout: 120000,
        });
        assert.equal(settingsResponse?.status(), 200);
        await page.getByText("Analytics have not been configured by the site owner").waitFor({ timeout: 60000 });
        assert.equal(await page.getByRole("button", { name: "Allow analytics" }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: "Decline analytics" }).isDisabled(), true);
        assert.equal(await page.locator('script[data-cubing-analytics="true"]').count(), 0);
        assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').count(), 0);
        assert.deepEqual(requests, [], `unexpected analytics requests with stored consent ${storedConsent}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
