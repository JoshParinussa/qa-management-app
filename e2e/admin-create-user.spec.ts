import { test, expect } from "@playwright/test";

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
}

test("admin can create a new user and the user shows up in users list", async ({ page }) => {
  await loginAs(page, "jopa@example.com", "password123");
  await page.waitForURL("**/dashboard");

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  const stamp = Date.now();
  const name = `E2E Member ${stamp}`;
  const email = `e2e-${stamp}@example.com`;

  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role").selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();

  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
});

test("new user with default password is forced to change password on first login", async ({ page }) => {
  // First, admin creates a user
  await loginAs(page, "jopa@example.com", "password123");
  await page.waitForURL("**/dashboard");

  const stamp = Date.now();
  const name = `First Login ${stamp}`;
  const email = `firstlogin-${stamp}@example.com`;

  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role").selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });

  // Admin logs out
  await page.getByRole("button", { name: /toggle sidebar/i }).click().catch(() => {});
  // Use logout via URL fallback if dropdown unavailable
  await page.context().clearCookies();

  // New user logs in with default password
  await loginAs(page, email, "password123");

  // Should be redirected to /change-password, not /dashboard
  await page.waitForURL("**/change-password", { timeout: 15_000 });
  await expect(page.getByText("Buat Password Baru")).toBeVisible({ timeout: 15_000 });

  // Submit a new strong password
  const newPassword = "NewStrongPass123!";
  await page.getByLabel("Password Baru").fill(newPassword);
  await page.getByLabel("Konfirmasi Password").fill(newPassword);
  await page.getByRole("button", { name: /simpan password baru/i }).click();

  // After change, should land on dashboard
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Verify new password works for subsequent login
  await page.context().clearCookies();
  await loginAs(page, email, newPassword);
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
