// Check what visitors actually see with JavaScript disabled on desktop and mobile.
// This checks discoverability and accessible navigation, not interactive tool support.
// CI temporarily applies the independent PR #6 SSR fix to its disposable runner.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

test("both welcome URLs expose readable navigation without JavaScript on desktop and mobile", { timeout: 180000 }, async () => {
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
        javaScriptEnabled: false,
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

            const heading = page.locator("main h1", { hasText: "魔方练习与社区工具" });
            assert.equal(await heading.count(), 1, `${label}: missing or duplicated h1`);
            assert.equal(await heading.isVisible(), true, `${label}: h1 not visible without JS`);
            assert.equal(
              await page.locator("main").getByText("本站并非 WCA 官方网站。").isVisible(),
              true,
              `${label}: non-affiliation statement not visible`,
            );

            const english = page.locator('main p[lang="en"]');
            assert.equal(await english.isVisible(), true, `${label}: English introduction hidden without JS`);
            assert.match(await english.innerText(), /not an official WCA website/i);

            const noScriptNote = page.locator("main noscript p");
            assert.equal(await noScriptNote.isVisible(), true, `${label}: missing no-JS notice`);
            assert.match(await noScriptNote.innerText(), /Interactive tools require JavaScript/);

            const nav = page.locator("main nav");
            assert.equal(await nav.getAttribute("aria-label"), "常用工具 / Popular tools", `${label}: navigation lacks bilingual accessible name`);
            for (const href of ["/timer", "/algs", "/wca/players"]) {
              const link = nav.locator(`a[href="${href}"], a[href="${href}/"]`);
              assert.equal(await link.count(), 1, `${label}: expected one link to ${href}`);
              assert.equal(await link.isVisible(), true, `${label}: link to ${href} hidden without JS`);
              assert.ok((await link.innerText()).trim(), `${label}: link to ${href} has no accessible text`);
              assert.match(await link.innerText(), /[A-Za-z]/, `${label}: link to ${href} lacks English label`);
              const englishLabel = link.locator('span[lang="en"]');
              assert.equal(await englishLabel.count(), 1, `${label}: English label for ${href} must declare its language`);
              assert.match(await englishLabel.innerText(), /[A-Za-z]/, `${label}: English label for ${href} is empty`);
            }
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
