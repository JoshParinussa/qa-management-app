import { test, expect } from "@playwright/test";

async function createMemberAndLogin(page: import("@playwright/test").Page) {
  // Admin creates a fresh QA member
  await page.goto("/login");
  await page.getByLabel("Email").fill("jopa@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");

  const stamp = Date.now();
  const email = `guard-${stamp}@example.com`;
  const name = `Guard Member ${stamp}`;
  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await page.context().clearCookies();

  // Member first login → change password
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/change-password", { timeout: 15_000 });
  const np = "GuardPass123!";
  await page.getByLabel("Password Baru").fill(np);
  await page.getByLabel("Konfirmasi Password").fill(np);
  await page.getByRole("button", { name: /simpan password baru/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

test("qa member is redirected away from admin users page", async ({ page }) => {
  await createMemberAndLogin(page);

  await page.goto("/users");
  // requireAdmin redirects non-admins to /dashboard
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("qa member cannot reach project create page", async ({ page }) => {
  await createMemberAndLogin(page);

  await page.goto("/projects/new");
  // canManageProjects is false for QA_MEMBER → redirect to /projects
  await page.waitForURL("**/projects", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
});

test("unauthenticated user is redirected from protected pages", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/users");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
