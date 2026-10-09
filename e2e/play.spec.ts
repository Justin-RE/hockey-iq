import { expect, test } from "@playwright/test";

test("guest plays a scenario and sees progress saved on the device", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /Marking: goal-side and ball-side/ }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Marking/);
  await expect(page.getByTestId("pitch").locator("canvas")).toBeVisible();

  const correct = page.getByRole("button", { name: /Between her and your goal/ });
  await expect(correct).toBeEnabled();
  await correct.click();

  await expect(page.getByRole("heading", { name: "Correct!" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Saved on this device/)).toBeVisible();

  await page.getByRole("link", { name: "My progress" }).click();
  await expect(page.getByText(/1\s+of 8 scenarios played/)).toBeVisible();
  await expect(page.getByText("Correct on first try")).toBeVisible();
});

test("keyboard answers, wrong-answer feedback, and retry", async ({ page }) => {
  await page.goto("/play/free-hit-five-yards");
  await expect(page.getByRole("button", { name: /Retreat to at least 5 yards/ })).toBeEnabled();

  await page.keyboard.press("2");
  await expect(page.getByRole("heading", { name: "Not quite" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("(best choice)")).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Not quite" })).toBeHidden();
  await expect(page.getByRole("button", { name: /Retreat to at least 5 yards/ })).toBeEnabled();
});

// With Cache Components the first request for an unlisted slug can stream a 200 before
// notFound() runs, so assert on what the user sees rather than the status code.
test("unknown scenario shows the not-found page", async ({ page }) => {
  await page.goto("/play/not-a-real-scenario");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
