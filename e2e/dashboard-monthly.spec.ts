import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

test("lead dashboard shows QA stat cards and sections", async ({ page }) => {
  await login(page, "lead@example.com");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Active projects")).toBeVisible();
  await expect(page.getByText("Pending review").first()).toBeVisible();
  await expect(page.getByText(/coverage per project/i)).toBeVisible();
  await expect(page.getByText(/top blockers/i)).toBeVisible();
});

test("admin dashboard shows reviewer view", async ({ page }) => {
  await login(page, "jopa@example.com");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Active projects")).toBeVisible();
  await expect(page.getByText("Pending review").first()).toBeVisible();
});

test("member dashboard shows personal summary", async ({ page }) => {
  // Use a fresh member created by admin so the password state is deterministic
  await login(page, "jopa@example.com");
  const stamp = Date.now();
  const email = `member-dash-${stamp}@example.com`;
  const name = `Member Dash ${stamp}`;
  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role").selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await page.context().clearCookies();

  // First login → forced change password
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/change-password", { timeout: 15_000 });
  const np = "MemberPass123!";
  await page.getByLabel("Password Baru").fill(np);
  await page.getByLabel("Konfirmasi Password").fill(np);
  await page.getByRole("button", { name: /simpan password baru/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Assigned projects")).toBeVisible();
  await expect(page.getByText("My recent reports")).toBeVisible();
});

test("monthly summary page loads with filter and export", async ({ page }) => {
  await login(page, "lead@example.com");

  await page.goto("/monthly-reports");
  await expect(page.getByRole("heading", { name: "Monthly reports" })).toBeVisible();
  await expect(page.getByLabel("Month")).toBeVisible();
  await expect(page.getByLabel("Project")).toBeVisible();
  await expect(page.getByRole("button", { name: /export markdown/i })).toBeVisible();
});
