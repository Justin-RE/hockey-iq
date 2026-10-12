import { expect, test, type Page } from "@playwright/test";

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

for (const path of [
  "/",
  "/play",
  "/play/goal-side-marking",
  "/progress",
  "/login",
  "/signup",
  "/privacy",
]) {
  test(`${path} fits the phone screen without scrolling sideways`, async ({ page }) => {
    await page.goto(path);
    if (path.startsWith("/play/")) {
      await expect(page.getByTestId("pitch").locator("canvas")).toBeVisible();
    }
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test("plays a scenario by tapping on a portrait pitch", async ({ page }) => {
  await page.goto("/play/goal-side-marking");

  const pitch = page.getByTestId("pitch");
  await expect(pitch).toHaveAttribute("data-orientation", "portrait");
  const canvas = await pitch.locator("canvas").boundingBox();
  const viewport = page.viewportSize();
  expect(canvas && viewport).toBeTruthy();
  expect(canvas!.height).toBeGreaterThan(canvas!.width);
  expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(viewport!.width);

  await expect(page.getByText(/Tip: press/)).toBeHidden();

  const correct = page.getByRole("button", { name: /Between her and your goal/ });
  await expect(correct).toBeEnabled();
  await correct.tap();

  const result = page.getByRole("heading", { name: "Correct!" });
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toBeInViewport();
});

test("header links are large enough to tap", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Play", "My progress", "Sign in"]) {
    const box = await nav.getByRole("link", { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});
