import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });

test.after(async () => {
  await browser.close();
});

test("desktop: Tab reveals skip link and Enter focuses the main landmark", async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(`${baseUrl}/welcome`, { waitUntil: "domcontentloaded" });
    const skip = page.locator('a[href="#main-content"]');
    await skip.waitFor();
    await page.keyboard.press("Tab");

    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("href")),
      "#main-content",
      "The first Tab should focus the skip link",
    );

    const inViewport = await skip.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight;
    });
    assert.ok(inViewport, "Focused skip link must be visible on screen");

    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.id === "main-content");
    assert.equal(await page.locator("main#main-content").count(), 1);
  } finally {
    await page.close();
  }
});

test("mobile: localized skip link is keyboard-accessible", async () => {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    await page.addInitScript(() => {
      localStorage.setItem("cubing_pro_locale", "ja-JP");
    });
    await page.goto(`${baseUrl}/welcome`, { waitUntil: "domcontentloaded" });
    const skip = page.locator('a[href="#main-content"]');
    await skip.waitFor();
    await page.waitForFunction(
      () => document.querySelector('a[href="#main-content"]')?.textContent?.includes("メインコンテンツ"),
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("href")),
      "#main-content",
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.id === "main-content");
  } finally {
    await page.close();
  }
});
