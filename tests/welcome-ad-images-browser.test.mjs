// Browser regression for encoded, non-ASCII advertisement image paths.
// Run against the production Next.js server after building the PR branch.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const images = JSON.parse(
  readFileSync(new URL("../src/views/Advertisement/ads/cuberwenjun.json", import.meta.url), "utf8"),
);

test("advertisement images render and decode in production Chrome", { timeout: 120000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL("/advertisement/?key=cuberwenjun", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    assert.equal(response?.status(), 200);

    const advertisementImages = page.locator('main img[src^="/advertisement/cuberwenjun/"]');
    await advertisementImages.first().waitFor({ state: "attached", timeout: 60000 });
    assert.equal(await advertisementImages.count(), images.length, "Expected every advertised image");

    for (const item of images) {
      const encoded = encodeURI(item.src);
      const image = page.locator(`main img[src="${encoded}"]`);
      assert.equal(await image.count(), 1, `Missing encoded image: ${item.src}`);
      const loaded = await image.evaluate(async (element) => {
        try {
          await element.decode();
          return element.naturalWidth > 0 && element.naturalHeight > 0;
        } catch {
          return false;
        }
      });
      assert.equal(loaded, true, `Image did not decode: ${item.src}`);
    }
    // Both the root homepage and /welcome render the same advertisement carousel.
    // Test each production route, rather than relying on the detail page alone.
    for (const pathname of ["/", "/welcome/"]) {
      const response = await page.goto(new URL(pathname, baseUrl).href, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      assert.equal(response?.status(), 200, `${pathname} must render successfully`);
      const thumbnail = page.locator('img[alt="俊改魔方"]');
      await thumbnail.waitFor({ state: "attached", timeout: 60000 });
      assert.equal(await thumbnail.count(), 1, `${pathname}: expected one carousel thumbnail`);
      assert.equal(
        await thumbnail.getAttribute("src"),
        encodeURI(images[0].src),
        `${pathname}: thumbnail must use the encoded image path`,
      );
      const thumbnailDecoded = await thumbnail.evaluate(async (element) => {
        try {
          await element.decode();
          return element.naturalWidth > 0 && element.naturalHeight > 0;
        } catch {
          return false;
        }
      });
      assert.equal(thumbnailDecoded, true, `${pathname}: thumbnail did not decode`);
    }
  } finally {
    await browser.close();
  }
});
