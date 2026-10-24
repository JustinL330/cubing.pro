import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });

test.after(async () => browser.close());

async function openMobileMenu(page) {
  await page.goto(`${baseUrl}/welcome`, { waitUntil: "domcontentloaded" });
  const trigger = page.locator('header button').filter({ hasText: "☰" });
  await trigger.waitFor();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute("aria-label") ===
    document.querySelector('[role="dialog"] button[aria-label]')?.getAttribute("aria-label"),
  );
  return { trigger, dialog };
}

test("mobile: Escape closes menu and restores trigger focus", async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    const { trigger, dialog } = await openMobileMenu(page);
    assert.equal(await dialog.count(), 1);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
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
