// Chromium integration checks for the homepage carousel. The CI browser job
// applies PR #6's pending SSR image-URL fix only in its disposable checkout.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
test.after(async () => browser.close());

async function openWelcome({ locale = "en-US", reducedMotion = "no-preference", mobile = false } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  await page.addInitScript((selectedLocale) => {
    localStorage.setItem("cubing_pro_locale", selectedLocale);
  }, locale);
  const response = await page.goto(`${baseUrl}/welcome/`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  assert.equal(response?.status(), 200, "Welcome page should render successfully");
  await page.waitForFunction((selectedLocale) => document.documentElement.lang === selectedLocale, locale);
  await page.locator(".ad-carousel-toggle").waitFor();
  assert.equal(await page.locator(".ad-carousel-slide").count(), 2);
  return { context, page };
}

test("reduced-motion visitors can choose slides and explicitly resume or pause", async () => {
  const { context, page } = await openWelcome({ reducedMotion: "reduce" });
  try {
    const toggle = page.locator(".ad-carousel-toggle");
    assert.equal(await toggle.getAttribute("aria-label"), "Resume automatic rotation");
    assert.equal(await toggle.getAttribute("aria-pressed"), "true");

    await page.getByRole("button", { name: "Go to slide 2 of 2" }).click();
    const slides = page.locator(".ad-carousel-slide");
    assert.equal(await slides.nth(0).getAttribute("aria-hidden"), "true");
    assert.notEqual(await slides.nth(0).getAttribute("inert"), null);
    assert.equal(await slides.nth(1).getAttribute("aria-hidden"), "false");
    assert.equal(await slides.nth(1).getAttribute("inert"), null);

    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-label"), "Pause automatic rotation");
    assert.equal(await toggle.getAttribute("aria-pressed"), "false");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-label"), "Resume automatic rotation");
  } finally {
    await context.close();
  }
});

test("hover and keyboard focus pause autoplay, with Japanese controls on mobile", async () => {
  const { context, page } = await openWelcome({
    locale: "ja-JP",
    reducedMotion: "no-preference",
    mobile: true,
  });
  try {
    const toggle = page.locator(".ad-carousel-toggle");
    const track = page.locator(".ad-carousel-track");
    assert.equal(await toggle.getAttribute("aria-label"), "自動切り替えを一時停止");

    // Hovering a carousel pauses it without changing the explicit play choice.
    await page.locator(".ad-carousel-wrapper").hover();
    await page.waitForFunction(() => document.querySelector(".ad-carousel-track")?.getAttribute("aria-live") === "polite");
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => document.querySelector(".ad-carousel-track")?.getAttribute("aria-live") === "off");

    await toggle.focus();
    await page.waitForFunction(() => document.querySelector(".ad-carousel-track")?.getAttribute("aria-live") === "polite");
    assert.equal(await toggle.evaluate((node) => document.activeElement === node), true);
    await page.getByRole("button", { name: "全2枚中2枚目に移動" }).click();
    assert.equal(await track.getAttribute("aria-live"), "polite");
    assert.equal(await toggle.getAttribute("aria-label"), "自動切り替えを再開");
    assert.equal(await page.locator(".ad-carousel-dot--active").count(), 1);
  } finally {
    await context.close();
  }
});
