import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const header = readFileSync("src/components/layout/AppHeader.tsx", "utf8");

test("mobile menu is an accessible modal dialog with a named close button", () => {
  assert.match(header, /role="dialog"/);
  assert.match(header, /aria-modal="true"/);
  assert.match(header, /aria-label=\{t\("nav.menu"\)\}/);
  assert.match(header, /ref=\{closeButtonRef\}/);
});

test("keyboard handling supports Escape, Tab trapping and focus restoration", () => {
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /event\.key !== "Tab"/);
  assert.match(header, /last\.focus\(\)/);
  assert.match(header, /first\.focus\(\)/);
  assert.match(header, /previousFocus\.focus\(\)/);
  assert.match(header, /document\.removeEventListener\("keydown", onKeyDown\)/);
});
