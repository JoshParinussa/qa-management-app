import { test, expect } from "@playwright/test";
import { loginAs, loginAndChangePassword, SEEDED, SEEDED_INITIAL_PASSWORD } from "./helpers";

test("lead dashboard shows QA stat cards and sections", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Active projects")).toBeVisible();
  await expect(page.getByText("Pending review").first()).toBeVisible();
  await expect(page.getByText(/coverage per project/i)).toBeVisible();
  await expect(page.getByText(/top blockers/i)).toBeVisible();
});

test("admin dashboard shows reviewer view", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Active projects")).toBeVisible();
  await expect(page.getByText("Pending review").first()).toBeVisible();
});

test("member dashboard shows personal summary", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const email = `member-dash-${stamp}@example.com`;
  const name = `Member Dash ${stamp}`;
  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await page.context().clearCookies();

  await loginAndChangePassword(page, email, SEEDED_INITIAL_PASSWORD, "MemberPass123!");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Assigned projects")).toBeVisible();
  await expect(page.getByText("My recent reports")).toBeVisible();
});

test("monthly summary page loads with filter and export", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  await page.goto("/monthly-reports");
  await expect(page.getByRole("heading", { name: "Monthly reports" })).toBeVisible();
  await expect(page.getByLabel("Month")).toBeVisible();
  await expect(page.getByLabel("Project")).toBeVisible();
  await expect(page.getByRole("button", { name: /export markdown/i })).toBeVisible();
});
