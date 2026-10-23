// Run with: node --experimental-strip-types --test tests/wca-search-rules.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import {
  filterWcaSearchResults,
  getVisibleWcaSearchResults,
  getWcaSearchCountries,
  getWcaSearchCountryKey,
  getWcaSearchCountryLabel,
  getWcaSearchResultPolicy,
} from "../src/views/Wca/wcaSearchRules.ts";

const player = (n, country = "HK") => ({
  wca_id: `2026TEST${String(n).padStart(2, "0")}`,
  name: `Player ${n}`,
  iso2: country,
  country_id: country,
});
const players = (count) => Array.from({ length: count }, (_, i) => player(i));

test("20/100 boundary policy", () => {
  for (const n of [0, 1, 20]) assert.equal(getWcaSearchResultPolicy(n), "show");
  for (const n of [21, 50, 100]) assert.equal(getWcaSearchResultPolicy(n), "confirm");
  assert.equal(getWcaSearchResultPolicy(101), "narrow");
});

test("preview only when confirmation is required", () => {
  assert.equal(getVisibleWcaSearchResults(players(20), false).length, 20);
  assert.equal(getVisibleWcaSearchResults(players(21), false).length, 20);
  assert.equal(getVisibleWcaSearchResults(players(21), true).length, 21);
  assert.equal(getVisibleWcaSearchResults(players(100), true).length, 100);
  assert.equal(getVisibleWcaSearchResults(players(101), true).length, 0);
});

test("country selection filters only returned players", () => {
  const sample = [player(1, "HK"), player(2, "US"), player(3, "hk")];
  assert.deepEqual(getWcaSearchCountries(sample), ["HK", "US"]);
  assert.equal(filterWcaSearchResults(sample, " hk ").length, 2);
  assert.equal(filterWcaSearchResults(sample, "JP").length, 0);
  assert.equal(filterWcaSearchResults(sample, "").length, 3);
  assert.equal(sample.length, 3);
});

test("fallback to WCA country identifier when ISO2 is absent", () => {
  assert.equal(getWcaSearchCountryKey({ country_id: " China " }), "CHINA");
  assert.equal(getWcaSearchCountryKey({ country_id: "China", iso2: " cn " }), "CN");
});

test("country labels use active interface language with safe fallback", () => {
  assert.equal(getWcaSearchCountryLabel("US", "USA", "en-US"), "United States");
  assert.equal(getWcaSearchCountryLabel("JP", "Japan", "ja-JP"), "日本");
  assert.equal(getWcaSearchCountryLabel(undefined, "China", "en-US"), "China");
  assert.equal(getWcaSearchCountryLabel("ZZ", "Unknown region", "en-US"), "Unknown region");
});
