import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const metadata = read("src/lib/homepageMetadata.ts");
const home = read("src/app/page.tsx");
const welcome = read("src/app/(main)/welcome/page.tsx");

test("both welcome URLs use one shared metadata definition", () => {
  for (const source of [home, welcome]) {
    assert.match(source, /import \{ homepageMetadata \} from "@\/lib\/homepageMetadata"/);
    assert.match(source, /export const metadata = homepageMetadata;/);
  }
});

test("homepage description names real public features without claiming WCA affiliation", () => {
  assert.match(metadata, /魔方计时与打乱练习/);
  assert.match(metadata, /WCA 选手和赛事查询/);
  assert.match(metadata, /公式资料/);
  assert.match(metadata, /并非 WCA 官方网站/);
});

test("root and nested welcome use one absolute branded title", () => {
  assert.match(metadata, /const homepageTitle = "魔方练习与社区工具 · Cubing Pro"/);
  assert.match(metadata, /title: \{ absolute: homepageTitle \}/);
});

test("social preview reuses the same title and description", () => {
  assert.match(metadata, /description: homepageDescription,/);
  assert.match(metadata, /openGraph:\s*\{\s*type: "website",\s*title: homepageTitle,\s*description: homepageDescription,/);
});

test("no unverified canonical, hreflang, or fork deployment URL is published", () => {
  const code = metadata.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(code, /metadataBase\s*:|alternates\s*:|canonical\s*:|hreflang|https?:\/\//i);
});

test("both welcome routes provide useful server-rendered Suspense fallback", () => {
  const fallback = read("src/components/pages/WelcomeLoadingFallback.tsx");
  for (const source of [home, welcome]) {
    assert.match(source, /<Suspense fallback=\{<WelcomeLoadingFallback \/>\}>/);
  }
  assert.match(fallback, /<h1\b/);
  for (const href of ["/timer", "/algs", "/wca/players"]) {
    assert.ok(fallback.includes(`href="${href}"`));
  }
});
