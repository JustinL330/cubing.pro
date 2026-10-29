// Regression check that the SSR loading fallback gives way to the real
// interactive welcome view with JavaScript enabled, on desktop and mobile.
// The workflow's disposable runner applies PR #6's separate SSR prerequisite.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

test("both welcome URLs hydrate on desktop and mobile without duplicate headings", { timeout: 240000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });

  try {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 375, height: 667 },
    ]) {
      const context = await browser.newContext({
        javaScriptEnabled: true,
        viewport,
      });
      try {
        for (const path of ["/", "/welcome/"]) {
          const page = await context.newPage();
          const label = `${path} (${viewport.width}px)`;
          try {
            const response = await page.goto(new URL(path, baseUrl).href, {
              waitUntil: "domcontentloaded",
              timeout: 90000,
            });
            assert.equal(response?.status(), 200, `${label}: unexpected HTTP status`);

            // PracticeHub is a client component, not the SSR fallback.
            await page.getByText("Cubing Pro · Practice & Learn", { exact: true })
              .waitFor({ state: "visible", timeout: 60000 });
            await page.locator('main [aria-labelledby="welcome-loading-heading"]')
              .waitFor({ state: "detached", timeout: 30000 });

            const heading = page.locator("main h1");
            assert.equal(await heading.count(), 1, `${label}: duplicate or missing hydrated h1`);
            assert.equal(await heading.isVisible(), true, `${label}: hydrated heading hidden`);

            const timerLink = page.locator('main a[href="/timer"], main a[href="/timer/"]').first();
            assert.equal(await timerLink.isVisible(), true, `${label}: timer link missing after hydration`);
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
