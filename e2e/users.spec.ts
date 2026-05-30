import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jopa@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

async function createUser(page: import("@playwright/test").Page, name: string, email: string) {
  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role").selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
}

test("admin can edit a user's name", async ({ page }) => {
  await loginAdmin(page);

  const stamp = Date.now();
  const email = `edituser-${stamp}@example.com`;
  const name = `Edit User ${stamp}`;
  const renamed = `Renamed User ${stamp}`;

  await createUser(page, name, email);

  // Open edit page from user row
  const row = page.getByRole("row").filter({ hasText: email });
  await row.getByRole("link", { name: /edit/i }).click();
  await page.waitForURL(/\/users\/[^/]+\/edit$/);

  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("button", { name: /save changes/i }).click();

  await page.waitForURL("**/users");
  await expect(page.getByRole("cell", { name: renamed })).toBeVisible({ timeout: 15_000 });
});

test("admin can reset a user's password and login with new password", async ({ page }) => {
  await loginAdmin(page);

  const stamp = Date.now();
  const email = `resetpwd-${stamp}@example.com`;
  const name = `Reset Pwd ${stamp}`;

  await createUser(page, name, email);

  const row = page.getByRole("row").filter({ hasText: email });
  await row.getByRole("link", { name: /edit/i }).click();
  await page.waitForURL(/\/users\/[^/]+\/edit$/);

  await page.getByRole("button", { name: /^reset password$/i }).click();

  // Generated password tampil sekali — ambil dari <code>
  const codeLocator = page.locator("code").first();
  await expect(codeLocator).toBeVisible({ timeout: 15_000 });
  const newPassword = (await codeLocator.textContent())?.trim() || "";
  expect(newPassword.length).toBeGreaterThanOrEqual(12);

  // Logout via clearing cookies
  await page.context().clearCookies();

  // Login pakai password baru — harus diarahkan ke change-password karena resetPasswordAction set must_change_password=true
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/change-password", { timeout: 15_000 });
  await expect(page.getByText("Buat Password Baru")).toBeVisible();
});
