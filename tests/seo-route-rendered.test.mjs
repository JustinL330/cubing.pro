import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function getMetadata(path) {
  const response = await fetch(new URL(path, base), { redirect: "follow" });
  assert.equal(response.status, 200, `${path} should return HTTP 200`);
  const html = await response.text();
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1] ?? "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? "";
  return { robots, description };
}

test("auth and account pages render noindex robots metadata", async () => {
  for (const path of [
    "/login/",
    "/auth/callback/",
    "/settings/",
    "/user/profile/",
    "/user/kv-data/",
    "/old-login/",
    "/test/",
    "/admin/users/",
    "/admin/organizers/",
  ]) {
    const { robots } = await getMetadata(path);
    assert.match(robots, /(?:^|,\s*)noindex(?:,|$)/, path);
    assert.match(robots, /(?:^|,\s*)nofollow(?:,|$)/, path);
  }
});

test("public timer has description and is not noindexed", async () => {
  const { robots, description } = await getMetadata("/timer/");
  assert.doesNotMatch(robots, /noindex/i);
  assert.match(description, /Ao5\/Ao12/);
  assert.match(description, /scrambles/i);
});

// Public WCA search must not inherit the admin/account noindex policy.
test("public WCA search remains indexable", async () => {
  const { robots } = await getMetadata("/wca/players/");
  assert.doesNotMatch(robots, /noindex/i);
});
