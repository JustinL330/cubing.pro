import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fetchAvatarThumbnails, getAvatarFetchIds } from "../src/views/Welcome/thanksAvatarRequests.ts";

const person = (i) => ({ wcaID: `2026TEST${String(i).padStart(2, "0")}` });

test("collapsed sponsor cards only fetch visible, unique, uncached avatars", () => {
  const people = Array.from({ length: 15 }, (_, i) => person(i));
  people[2].avatar = "/existing-avatar.png";
  people.push(person(0), { wcaID: "-" });
  const requested = new Set([person(3).wcaID]);

  const collapsed = getAvatarFetchIds(people, false, 12, requested);
  assert.equal(collapsed.length, 10);
  assert.ok(collapsed.includes(person(11).wcaID));
  assert.ok(!collapsed.includes(person(12).wcaID));
  assert.ok(!collapsed.includes(person(2).wcaID));
  assert.ok(!collapsed.includes(person(3).wcaID));

  const expanded = getAvatarFetchIds(people, true, 12, requested);
  assert.equal(expanded.length, 13);
  assert.ok(expanded.includes(person(14).wcaID));
  assert.equal(new Set(expanded).size, expanded.length);
  assert.ok(!expanded.includes("-"));
});

test("avatar fetches never exceed the configured concurrency and tolerate failures", async () => {
  const ids = Array.from({ length: 17 }, (_, i) => person(i).wcaID);
  let inFlight = 0;
  let peak = 0;
  const results = new Map();
  await fetchAvatarThumbnails(
    ids,
    async (id) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 2));
      inFlight -= 1;
      if (id === ids[5]) throw new Error("temporary WCA API error");
      return `/avatar/${id}.png`;
    },
    (id, url) => results.set(id, url),
  );
  assert.equal(peak, 4);
  assert.equal(inFlight, 0);
  assert.equal(results.size, 16);
  assert.equal(results.get(ids[16]), `/avatar/${ids[16]}.png`);
});

test("no visible WCA IDs means no requests", async () => {
  assert.deepEqual(getAvatarFetchIds([{ wcaID: "-" }], false, 12, new Set()), []);
  let calls = 0;
  await fetchAvatarThumbnails([], async () => {
    calls += 1;
    return undefined;
  }, () => {});
  assert.equal(calls, 0);
});

test("component serializes expansion batches instead of starting parallel worker pools", () => {
  const component = readFileSync(new URL("../src/views/Welcome/ThanksSection.tsx", import.meta.url), "utf8");
  assert.match(component, /avatarRequestQueue\.current = avatarRequestQueue\.current\.then\(\(\) => fetchAvatarThumbnails\(/);
  assert.match(component, /\[thanksList, expanded\]/);
});
