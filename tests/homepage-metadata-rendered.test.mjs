import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

function metaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((candidate) =>
    candidate.includes(`${key}="${value}"`),
  );
  assert.ok(tag, `Missing <meta ${key}="${value}">`);
  return tag.match(/\bcontent="([^"]*)"/i)?.[1] ?? "";
}

async function fetchHomepage(path) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "follow" });
  const html = await response.text();
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}: ${html.slice(0, 200)}`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i);
  assert.doesNotMatch(html, /ByteString.*codepoint|codepoint.*ByteString/i);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "";
  const description = metaContent(html, "name", "description");
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const ogType = metaContent(html, "property", "og:type");

  assert.match(title, /魔方练习与社区工具/);
  assert.match(description, /魔方计时与打乱练习/);
  assert.match(description, /并非 WCA 官方网站/);
  assert.equal(ogDescription, description, `${path}: OG description differs`);
  assert.match(ogTitle, /魔方练习与社区工具/);
  assert.equal(ogType, "website");
  assert.doesNotMatch(html, /<link\b[^>]*\brel="canonical"/i);
  assert.doesNotMatch(html, /<meta\b[^>]*\bproperty="og:url"/i);

  // Verify meaningful HTML exists before hydration: crawlers should see
  // headings and internal links, not just metadata or serialized RSC data.
  const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  assert.ok(mainHtml, `${path}: missing server-rendered <main>`);
  assert.match(mainHtml, /<h1\b[^>]*>/i, `${path}: missing server-rendered h1`);
  for (const href of ["/timer", "/algs", "/wca/players"]) {
    assert.ok(
      mainHtml.includes(`href="${href}"`) || mainHtml.includes(`href="${href}/"`),
      `${path}: missing server-rendered link to ${href}`,
    );
  }

  return { title, description, ogTitle, ogDescription };
}

test("root and welcome render matching public metadata over HTTP", async () => {
  const root = await fetchHomepage("/");
  const welcome = await fetchHomepage("/welcome/");
  assert.deepEqual(root, welcome);
});
