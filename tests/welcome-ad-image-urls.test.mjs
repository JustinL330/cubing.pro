import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const data = JSON.parse(readFileSync("src/views/Advertisement/ads/cuberwenjun.json", "utf8"));
const component = readFileSync("src/views/Advertisement/ads/cuberwenjun.tsx", "utf8");

test("advertisement image sources are encoded before server rendering", () => {
  assert.match(component, /src=\{encodeURI\(THUMBNAIL_IMG\)\}/);
  assert.match(component, /src=\{encodeURI\(item\.src\)\}/);
  assert.ok(data.length > 0, "advertisement must have images");
  for (const item of data) {
    assert.ok(item.src.startsWith("/advertisement/"), item.src);
    assert.ok(existsSync(`public${item.src}`), `Missing image: ${item.src}`);
    assert.match(encodeURI(item.src), /^[\x00-\x7F]+$/, `Non-ASCII URL: ${item.src}`);
    assert.ok(encodeURI(item.src).startsWith("/advertisement/"));
  }
});

test("welcome and advertisement SSR plus all image assets respond successfully", {
  skip: process.env.TEST_SERVER !== "1",
}, async () => {
  const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
  for (const path of ["/", "/welcome/", "/advertisement/?key=cuberwenjun"]) {
    const response = await fetch(new URL(path, baseUrl));
    const html = await response.text();
    assert.equal(response.status, 200, `${path}: ${html.slice(0, 250)}`);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.doesNotMatch(html, /ByteString.*codepoint|codepoint.*ByteString/i);
  }
  for (const item of data) {
    const response = await fetch(new URL(encodeURI(item.src), baseUrl));
    assert.equal(response.status, 200, `Image unavailable: ${item.src}`);
    assert.match(response.headers.get("content-type") ?? "", /image\//);
    await response.arrayBuffer();
  }
});
