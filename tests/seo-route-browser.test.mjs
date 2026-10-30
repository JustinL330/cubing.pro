// Browser regression: private/admin routes must keep noindex metadata,
// while public tool pages remain indexable. This is not an access-control test.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const privatePaths = [
  "/login/",
  "/auth/callback/",
  "/settings/",
  "/user/profile/",
  "/user/kv-data/",
  "/old-login/",
  "/test/",
  "/admin/users/",
  "/admin/organizers/",
  "/admin/organizers/comps/",
  "/admin/manage/groups/",
];
const publicPaths = ["/timer/", "/wca/players/"];

test("Chrome respects private noindex and public indexability with and without JavaScript", { timeout: 240000 }, async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  try {
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled });
      try {
        // Client-side authentication redirects may occur with JS enabled;
        // check stable settings and public routes in that mode.
        const paths = javaScriptEnabled
          ? ["/settings/", "/user/profile/", ...publicPaths]
          : [...privatePaths, ...publicPaths];
        for (const path of paths) {
          const page = await context.newPage();
          const label = `${path} (JS ${javaScriptEnabled ? "on" : "off"})`;
          try {
            const response = await page.goto(new URL(path, baseUrl).href, {
              waitUntil: "domcontentloaded",
              timeout: 90000,
            });
            assert.equal(response?.status(), 200, `${label}: expected HTTP 200`);
            assert.match(response?.headers()["content-type"] ?? "", /text\/html/i, label);

            const robots = (await page.locator('meta[name="robots"]').first()
              .getAttribute("content").catch(() => null)) ?? "";
            if (privatePaths.includes(path)) {
              assert.match(robots, /(?:^|,)\s*noindex\b/i, `${label}: noindex missing`);
              assert.match(robots, /(?:^|,)\s*nofollow\b/i, `${label}: nofollow missing`);
            } else {
              assert.doesNotMatch(robots, /noindex/i, `${label}: public page noindexed`);
            }

            if (path === "/timer/") {
              const description = await page.locator('meta[name="description"]').first()
                .getAttribute("content");
              assert.match(description ?? "", /Ao5\/Ao12/, `${label}: timer description missing`);
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
