// Check what visitors actually see with JavaScript disabled. This is a
// discoverability check, not a claim that the interactive tools work without JS.
// CI temporarily applies the independent PR #6 SSR fix to its disposable runner.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

test("both welcome URLs expose readable navigation without JavaScript", { timeout: 120000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });

  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1280, height: 900 },
    });
    try {
      for (const path of ["/", "/welcome/"]) {
        const page = await context.newPage();
        try {
          const response = await page.goto(new URL(path, baseUrl).href, {
            waitUntil: "domcontentloaded",
            timeout: 90000,
          });
          assert.equal(response?.status(), 200, `${path}: unexpected HTTP status`);

          const heading = page.locator("main h1", { hasText: "魔方练习与社区工具" });
          assert.equal(await heading.count(), 1, `${path}: missing or duplicated h1`);
          assert.equal(await heading.isVisible(), true, `${path}: h1 not visible without JS`);
          assert.equal(
            await page.locator("main").getByText("本站并非 WCA 官方网站。").isVisible(),
            true,
            `${path}: non-affiliation statement not visible`,
          );

          for (const href of ["/timer", "/algs", "/wca/players"]) {
            const link = page.locator(`main a[href="${href}"]`);
            assert.equal(await link.count(), 1, `${path}: expected one link to ${href}`);
            assert.equal(await link.isVisible(), true, `${path}: link to ${href} hidden without JS`);
          }
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
