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

test("social preview reuses the same title and description", () => {
  assert.match(metadata, /title: homepageTitle,/);
  assert.match(metadata, /description: homepageDescription,/);
  assert.match(metadata, /openGraph:\s*\{\s*type: "website",\s*title: homepageTitle,\s*description: homepageDescription,/);
});

test("no unverified canonical, hreflang, or fork deployment URL is published", () => {
  const code = metadata.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(code, /metadataBase\s*:|alternates\s*:|canonical\s*:|hreflang|https?:\/\//i);
});
