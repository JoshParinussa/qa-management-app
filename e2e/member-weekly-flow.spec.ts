import { test, expect } from "@playwright/test";
import { loginAs, loginAndChangePassword, SEEDED, SEEDED_INITIAL_PASSWORD } from "./helpers";

const MEMBER_PASSWORD = "MemberPass123!";

test("qa member completes onboarding and creates a weekly report", async ({ page }) => {
  const stamp = Date.now();
  const memberName = `Member Flow ${stamp}`;
  const memberEmail = `member-flow-${stamp}@example.com`;
  const projectName = `Member Project ${stamp}`;
  const code = `MBF${stamp}`.slice(0, 24);

  // 1. Admin buat QA member + project, lalu assign member ke project.
  await loginAs(page, SEEDED.admin.email);

  await page.goto("/users");
  await page.getByLabel("Nama").fill(memberName);
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name: memberName })).toBeVisible({ timeout: 15_000 });

  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(projectName);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");

  const projectRow = page.getByRole("row").filter({ hasText: projectName });
  await Promise.all([
    page.waitForURL(
      (url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new",
      { timeout: 15_000 },
    ),
    projectRow.getByRole("link", { name: "View" }).click(),
  ]);
  await page.getByLabel("User").selectOption({ label: `${memberName} (${memberEmail})` });
  await page.getByRole("button", { name: /^assign$/i }).click();
  await expect(page.getByRole("row").filter({ hasText: memberEmail })).toBeVisible({ timeout: 15_000 });

  await page.context().clearCookies();

  // 2. Member first login → forced change password.
  await loginAndChangePassword(page, memberEmail, SEEDED_INITIAL_PASSWORD, MEMBER_PASSWORD);

  // 3. Member buat weekly report untuk project yang di-assign.
  await page.goto("/weekly-reports");
  await page.getByRole("link", { name: /new report/i }).click();
  await page.waitForURL("**/weekly-reports/new");

  await page.getByLabel("Project").selectOption({ label: projectName });
  await page.getByLabel("Week start").fill("2026-05-04");
  await page.getByLabel("Week end").fill("2026-05-10");
  await page.getByLabel("summary item 1", { exact: true }).fill("QA member weekly progress.");
  await page.getByLabel("Test case total").fill("100");
  await page.getByLabel("Test case BE total").fill("60");
  await page.getByLabel("Test case FE total").fill("40");
  await page.getByLabel("BE total", { exact: true }).fill("20");
  await page.getByLabel("BE passed", { exact: true }).fill("18");
  await page.getByLabel("BE failed", { exact: true }).fill("2");
  await page.getByLabel("FE total", { exact: true }).fill("20");
  await page.getByLabel("FE passed", { exact: true }).fill("17");
  await page.getByLabel("FE failed", { exact: true }).fill("3");
  await page.getByLabel("Next week plan item 1", { exact: true }).fill("Finish remaining backend cases.");
  await page.getByRole("button", { name: /save draft/i }).click();

  await page.waitForURL("**/weekly-reports");
  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await expect(reportRow).toBeVisible({ timeout: 15_000 });
  await expect(reportRow.getByText("Draft")).toBeVisible();

  // 4. Member submit report.
  await reportRow.getByRole("link", { name: "View" }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /submit report/i }).click();
  await expect(page.getByText("Submitted")).toBeVisible({ timeout: 15_000 });
});
