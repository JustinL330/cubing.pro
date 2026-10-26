import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const privacy = readFileSync("src/lib/analyticsPrivacy.ts", "utf8");
const tracker = readFileSync("src/components/analytics/Ga4Analytics.tsx", "utf8");
const provider = readFileSync("src/components/ui/provider.tsx", "utf8");
const settings = readFileSync("src/views/SettingsPage.tsx", "utf8");
const translations = readFileSync("src/components/analytics/analyticsCopy.ts", "utf8");

test("GA4 is disabled without a valid ID and exact HTTPS deployment origin", () => {
  assert.match(privacy, /\^G-\[A-Z0-9\]\+\$/);
  assert.match(privacy, /configured\.origin === currentOrigin/);
  assert.match(tracker, /process\.env\.NODE_ENV === "production"/);
  assert.match(tracker, /NEXT_PUBLIC_SITE_ORIGIN/);
});

test("public routes are allowlisted and URLs exclude search parameters", () => {
  assert.match(privacy, /PUBLIC_ANALYTICS_ROUTES/);
  assert.match(privacy, /PUBLIC_ANALYTICS_ROUTES\.has\(path\)/);
  assert.doesNotMatch(privacy, /location\.search|searchParams/);
  assert.match(tracker, /safePageLocation\(SITE_ORIGIN, path\)/);
  assert.match(tracker, /page_referrer: ""/);
});

test("consent gates loading and manual page views without automatic duplicates", () => {
  assert.match(tracker, /consent !== "granted"/);
  assert.match(tracker, /send_page_view: false/);
  assert.match(tracker, /lastPath\.current === path/);
  assert.match(tracker, /"event", "page_view"/);
  assert.match(tracker, /analytics_storage: "denied"/);
  assert.match(tracker, /analytics_storage: "granted"/);
  assert.match(provider, /<Ga4Analytics \/>/);
  assert.match(settings, /<AnalyticsPreferences \/>/);
});

test("consent notices cover six supported locales", () => {
  for (const locale of ["zh-CN", "zh-TW", "en-US", "ja-JP", "ko-KR", "es-ES"]) {
    assert.ok(translations.includes(`"${locale}":`), locale);
  }
});

test("unconfigured analytics preferences cannot save a premature opt-in", () => {
  assert.match(tracker, /disabled=\{!configured\}/);
  assert.match(tracker, /if \(configured\) setConsent\("granted"\)/);
  assert.match(tracker, /if \(configured\) setConsent\("denied"\)/);
});
