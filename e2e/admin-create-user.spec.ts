import { test, expect } from "@playwright/test";
import { loginAs, loginAndChangePassword, SEEDED, SEEDED_INITIAL_PASSWORD } from "./helpers";

test("admin can create a new user and the user shows up in users list", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  const stamp = Date.now();
  const name = `E2E Member ${stamp}`;
  const email = `e2e-${stamp}@example.com`;

  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();

  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
});

test("new user with default password is forced to change password on first login", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const name = `First Login ${stamp}`;
  const email = `firstlogin-${stamp}@example.com`;

  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });

  // Logout via clearing cookies
  await page.context().clearCookies();

  // Pertama kali login → forced change password
  const newPassword = "NewStrongPass123!";
  await loginAndChangePassword(page, email, SEEDED_INITIAL_PASSWORD, newPassword);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Login ulang dengan password baru harus langsung ke dashboard
  await page.context().clearCookies();
  await loginAs(page, email, newPassword);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
