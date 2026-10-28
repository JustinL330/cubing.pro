// Regression check that the SSR loading fallback gives way to the real
// interactive welcome view when JavaScript is enabled.
// The workflow's disposable runner applies PR #6's separate SSR prerequisite.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

test("welcome fallback hydrates into the real practice hub on both routes", { timeout: 180000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });

  try {
    for (const path of ["/", "/welcome/"]) {
      const context = await browser.newContext({
        javaScriptEnabled: true,
        viewport: { width: 1280, height: 900 },
      });
      try {
        const page = await context.newPage();
        const response = await page.goto(new URL(path, baseUrl).href, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        assert.equal(response?.status(), 200, `${path}: unexpected HTTP status`);

        // The actual PracticeHub is a client component and is not the
        // server-rendered WelcomeLoadingFallback.
        await page.getByText("Cubing Pro · Practice & Learn", { exact: true })
          .waitFor({ state: "visible", timeout: 60000 });
        await page.locator('main [aria-labelledby="welcome-loading-heading"]')
          .waitFor({ state: "detached", timeout: 30000 });

        const heading = page.locator("main h1");
        assert.equal(await heading.count(), 1, `${path}: duplicate or missing hydrated h1`);
        assert.equal(await heading.isVisible(), true, `${path}: hydrated heading hidden`);

        const timerLink = page.locator('main a[href="/timer"], main a[href="/timer/"]').first();
        assert.equal(await timerLink.isVisible(), true, `${path}: timer link missing after hydration`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
