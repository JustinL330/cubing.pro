import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });

test.after(async () => browser.close());

async function openMobileMenu(page) {
  await page.addInitScript(() => localStorage.setItem("cubing_pro_locale", "en-US"));
  const response = await page.goto(`${baseUrl}/timer`, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "Timer page should load before testing the menu");
  // Wait for client hydration, not just server-rendered HTML, before clicking.
  await page.waitForFunction(() => document.documentElement.lang === "en-US");
  const previousOverflow = await page.evaluate(() => document.body.style.overflow);
  const trigger = page.locator('header button').filter({ hasText: "☰" });
  await trigger.waitFor();
  assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog");
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 8000 });
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute("aria-label") ===
    document.querySelector('[role="dialog"] button[aria-label]')?.getAttribute("aria-label"),
  );
  return { trigger, dialog, previousOverflow };
}

test("mobile: Escape closes menu and restores trigger focus", async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    const { trigger, dialog } = await openMobileMenu(page);
    assert.equal(await dialog.count(), 1);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  } finally {
    await page.close();
  }
});

test("mobile: Shift+Tab and Tab stay inside the navigation dialog", async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    const { dialog } = await openMobileMenu(page);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true);
    const lastHref = await page.evaluate(() => document.activeElement?.getAttribute("href"));
    assert.ok(lastHref, "Shift+Tab from close should wrap to the last navigation link");
    await page.keyboard.press("Tab");
    assert.equal(
      await dialog.evaluate((el) => el.querySelector("button[aria-label]") === document.activeElement),
      true,
    );
  } finally {
    await page.close();
  }
});

test("mobile: close button restores focus and releases scroll lock", async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    const { trigger, dialog, previousOverflow } = await openMobileMenu(page);
    assert.equal(await dialog.getAttribute("aria-modal"), "true");
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");

    await dialog.locator("button[aria-label]").first().click();
    await dialog.waitFor({ state: "detached" });
    await page.waitForFunction((expected) => document.body.style.overflow === expected, previousOverflow);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  } finally {
    await page.close();
  }
});

test("mobile: resizing to desktop dismisses dialog and moves focus to a visible header link", async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    const { dialog, previousOverflow } = await openMobileMenu(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await dialog.waitFor({ state: "detached", timeout: 8000 });
    await page.waitForFunction((expected) => document.body.style.overflow === expected, previousOverflow);
    assert.equal(
      await page.evaluate(() => {
        const focused = document.activeElement;
        return focused instanceof HTMLAnchorElement &&
          focused.closest("[data-app-header]") !== null &&
          focused.getClientRects().length > 0;
      }),
      true,
      "Focus should return to a visible header link, not the hidden mobile trigger",
    );
  } finally {
    await page.close();
  }
});
