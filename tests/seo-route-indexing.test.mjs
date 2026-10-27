import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("dedicated account, authentication and settings routes are noindex", () => {
  for (const path of [
    "src/app/(main)/login/page.tsx",
    "src/app/(main)/auth/callback/page.tsx",
    "src/app/(main)/settings/page.tsx",
    "src/app/(main)/user/profile/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/, path);
  }
});

test("catch-all account and admin routes get noindex without blocking public routes", () => {
  const source = read("src/app/(main)/[...path]/page.tsx");
  assert.match(source, /route\?\.id\.startsWith\("admin-"\)/);
  assert.match(source, /route\?\.id\.startsWith\("user-"\)/);
  assert.match(source, /route\?\.id === "old-login"/);
  assert.match(source, /robots:\s*noIndex\s*\?\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}\s*:\s*undefined/);
});

test("public timer has a feature-accurate description and remains indexable", () => {
  const source = read("src/app/(main)/timer/page.tsx");
  assert.match(source, /title:\s*"Cube Timer"/);
  for (const feature of ["scrambles", "15-second inspection", "Ao5\/Ao12", "without an account"]) {
    assert.ok(source.includes(feature), feature);
  }
  assert.doesNotMatch(source, /robots:\s*\{\s*index:\s*false/);
});
