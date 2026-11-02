import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shell = readFileSync("src/components/layout/AppShell.tsx", "utf8");
const skipLink = readFileSync("src/components/layout/SkipToMainLink.tsx", "utf8");

test("skip navigation appears before the header and targets main", () => {
  assert.ok(shell.indexOf("<SkipToMainLink />") >= 0);
  assert.ok(shell.indexOf("<SkipToMainLink />") < shell.indexOf("<AppHeader />"));
  assert.match(skipLink, /href="#main-content"/);
  assert.match(shell, /as="main" id="main-content" tabIndex=\{-1\}/);
});

test("skip navigation is revealed on keyboard focus", () => {
  assert.match(skipLink, /transform="translateY\(-200%\)"/);
  assert.match(skipLink, /_focusVisible=\{\{/);
  assert.match(skipLink, /transform: "translateY\(0\)"/);
});

test("skip link provides labels for all six supported locales", () => {
  for (const locale of ["zh-CN", "zh-TW", "en-US", "ja-JP", "ko-KR", "es-ES"]) {
    assert.ok(skipLink.includes(`"${locale}": "`), `Missing accessible label for ${locale}`);
  }
});
