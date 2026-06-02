import { test, expect } from "@playwright/test";
import { loginAs, loginAndChangePassword, SEEDED, SEEDED_INITIAL_PASSWORD } from "./helpers";

async function createMemberAndLogin(page: import("@playwright/test").Page) {
  // Admin buat fresh QA member, lalu member lewati first-login flow.
  await loginAs(page, SEEDED.admin.email);

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
  await loginAndChangePassword(page, email, SEEDED_INITIAL_PASSWORD, "GuardPass123!");
}

test("qa member is redirected away from admin users page", async ({ page }) => {
  await createMemberAndLogin(page);

  await page.goto("/users");
  // requireAdmin redirect non-admin ke /dashboard
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("qa member cannot reach project create page", async ({ page }) => {
  await createMemberAndLogin(page);

  await page.goto("/projects/new");
  // canManageProjects=false untuk QA_MEMBER → redirect ke /projects
  await page.waitForURL("**/projects", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
});

test("unauthenticated user is redirected from protected pages", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/users");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
