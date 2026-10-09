import { expect, test } from "@playwright/test";

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ status: "ok" });
});

test("deep health check reaches the database", async ({ request }) => {
  const res = await request.get("/api/health?deep=1");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ status: "ok", database: "ok" });
});

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
