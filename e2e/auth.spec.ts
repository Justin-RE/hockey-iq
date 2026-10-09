import { expect, test } from "@playwright/test";

const nickname = () => `Player_${Math.random().toString(36).slice(2, 10)}`;

test("sign up, save progress to the account, sign out, sign back in", async ({ page }) => {
  const nick = nickname();
  const password = "field-hockey-rocks";

  await page.goto("/signup");
  await page.getByLabel("Nickname").fill(nick);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByText(`Signed in as ${nick}`)).toBeVisible();
  await expect(page.getByText(/0\s+of 8 scenarios played/)).toBeVisible();

  await page.goto("/play/two-v-one-overlap");
  const answer = page.getByRole("button", { name: /Dribble at the defender/ });
  await expect(answer).toBeEnabled();
  await answer.click();
  await expect(page.getByText("Saved to your account.")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Nickname").fill(nick.toLowerCase());
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByText(/1\s+of 8 scenarios played/)).toBeVisible();
});

test("rejects a wrong password and a taken nickname", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Nickname").fill("Nobody_here_123");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Nickname or password is incorrect" }),
  ).toBeVisible();

  await page.goto("/signup");
  await page.getByLabel("Nickname").fill("ab");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/3-20 letters/).last()).toBeVisible();
  await expect(page.getByText("At least 8 characters").last()).toBeVisible();
});
