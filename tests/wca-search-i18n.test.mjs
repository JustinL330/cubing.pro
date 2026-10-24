// Run with: node --experimental-strip-types --test tests/wca-search-i18n.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import { wcaMessagesEnUS } from "../src/i18n/messages/wca-en-US.ts";
import { extraCatalogs } from "../src/i18n/extra-catalogs.ts";
import koKR from "../src/i18n/messages/ko-KR.ts";

const searchKeys = Object.keys(wcaMessagesEnUS)
  .filter((key) => key.startsWith("wca.players."))
  .sort();

function placeholders(message) {
  return [...message.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

for (const [locale, catalog] of Object.entries({
  "zh-TW": extraCatalogs["zh-TW"],
  "ja-JP": extraCatalogs["ja-JP"],
  "es-ES": extraCatalogs["es-ES"],
  "ko-KR": koKR,
})) {
  test(`${locale}: WCA player search has complete localized copy and matching placeholders`, () => {
    assert.ok(catalog, `Missing catalog for ${locale}`);
    for (const key of searchKeys) {
      const translated = catalog[key];
      assert.equal(typeof translated, "string", `${locale} missing ${key}`);
      assert.ok(translated.trim(), `${locale} has an empty translation for ${key}`);
      assert.deepEqual(
        placeholders(translated),
        placeholders(wcaMessagesEnUS[key]),
        `${locale} placeholders differ for ${key}`,
      );
    }
  });
}
