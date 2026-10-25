// Browser regression for the WCA Show all policy, with a deterministic local API mock.
// Run against a Next.js dev server started with
// NEXT_PUBLIC_API_BASE=http://127.0.0.1:3000/v3/cube-api
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
test.after(async () => browser.close());

function makePlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    wca_id: `2026AB${String(i).padStart(4, "0")}`,
    name: `Mock Player ${i + 1}`,
    iso2: i % 2 === 0 ? "HK" : "US",
    country_id: i % 2 === 0 ? "Hong Kong" : "USA",
    gender: "m",
  }));
}

async function openSearch(count) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const query = `mock${count}`;
  let intercepted = 0;
  await page.addInitScript(() => localStorage.setItem("cubing_pro_locale", "en-US"));
  await page.route("**/v3/cube-api/wca/players/**", async (route) => {
    if (decodeURIComponent(new URL(route.request().url()).pathname).endsWith(`/${query}`)) {
      intercepted += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makePlayers(count)),
      });
    } else {
      await route.abort();
    }
  });
  const response = await page.goto(`${baseUrl}/wca/players`, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200);
  await page.waitForFunction(() => document.documentElement.lang === "en-US");
  await page.getByRole("textbox", { name: "Enter WCA ID or name" }).fill(query);
  await page.waitForFunction(
    (expected) => document.body.textContent?.includes(`${expected} results`),
    count,
    { timeout: 15000 },
  );
  assert.ok(intercepted > 0, "Search must use the intercepted local API response");
  return page;
}

function rows(page) {
  return page.locator(".ant-table-tbody tr[data-row-key]");
}

test("25 returned players: preview 20, then show all 25 without hidden pagination", async () => {
  const page = await openSearch(25);
  try {
    assert.equal(await rows(page).count(), 20);
    await page.getByRole("button", { name: "Show all" }).click();
    await page.getByText("Showing 25 of 25 results").waitFor();
    assert.equal(await rows(page).count(), 25);
    assert.equal(await page.locator(".ant-pagination").count(), 0);
  } finally {
    await page.close();
  }
});

test("100 returned players: confirmation reveals every row", async () => {
  const page = await openSearch(100);
  try {
    assert.equal(await rows(page).count(), 20);
    await page.getByRole("button", { name: "Show all" }).click();
    await page.getByText("Showing 100 of 100 results").waitFor();
    assert.equal(await rows(page).count(), 100);
  } finally {
    await page.close();
  }
});

test("101 returned players: ask to narrow instead of rendering a huge table", async () => {
  const page = await openSearch(101);
  try {
    await page.getByText(/101 results\. Please narrow your query/).waitFor();
    assert.equal(await rows(page).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Show all" }).count(), 0);
  } finally {
    await page.close();
  }
});
