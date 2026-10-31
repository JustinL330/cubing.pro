// Browser-level regression for sponsor avatar requests.
// CI temporarily applies PR #6's pending /welcome SSR fix only in the runner.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const people = Array.from({ length: 18 }, (_, i) => ({
  wcaID: `2026TEST${String(i).padStart(2, "0")}`,
  nickname: `Sponsor ${String(i + 1).padStart(2, "0")}`,
  amount: 100 + i,
  avatar: "",
  other: "",
}));

test("welcome loads only visible WCA avatars, then loads remaining once with at most four in flight", { timeout: 180000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const requested = [];
  let active = 0;
  let peak = 0;

  try {
    await page.addInitScript(() => {
      localStorage.setItem("cubing_pro_locale", "en-US");
    });

    await page.route("**/public/acknowledgments*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(people),
      });
    });

    await page.route("**/api/v0/persons/*", async (route) => {
      const id = new URL(route.request().url()).pathname.split("/").pop();
      requested.push(id);
      active += 1;
      peak = Math.max(peak, active);
      try {
        // Keep requests in flight long enough to detect the concurrency limit.
        await new Promise((resolve) => setTimeout(resolve, 60));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            person: {
              avatar: {
                thumb_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
              },
            },
          }),
        });
      } finally {
        active -= 1;
      }
    });

    const response = await page.goto(`${baseUrl}/welcome/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    assert.equal(response?.status(), 200);

    const expand = page.getByRole("button", { name: "Show 6 more" });
    await expand.waitFor({ timeout: 60000 });

    async function waitForCount(expected) {
      const deadline = Date.now() + 45000;
      while (requested.length < expected && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.equal(requested.length, expected, `expected exactly ${expected} WCA avatar requests`);
    }

    await waitForCount(12);
    await page.waitForTimeout(300);
    assert.deepEqual(new Set(requested), new Set(people.slice(0, 12).map((p) => p.wcaID)));
    assert.equal(await page.getByRole("link", { name: "Sponsor 13" }).count(), 0);

    await expand.click();
    await page.getByRole("link", { name: "Sponsor 18" }).waitFor();
    await waitForCount(18);
    assert.deepEqual(new Set(requested), new Set(people.map((p) => p.wcaID)));
    assert.ok(peak <= 4, `maximum WCA avatar concurrency was ${peak}, expected <= 4`);
    assert.equal(peak, 4, "the worker pool should use four concurrent requests");

    await page.getByRole("button", { name: "Collapse" }).click();
    await page.getByRole("button", { name: "Show 6 more" }).click();
    await page.waitForTimeout(500);
    assert.equal(requested.length, 18, "re-expanding must not re-fetch the same WCA IDs");
  } finally {
    await context.close();
    await browser.close();
  }
});
