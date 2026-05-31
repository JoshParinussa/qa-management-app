import { test, expect } from "@playwright/test";

const MEMBER_PASSWORD = "MemberPass123!";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jopa@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

test("qa member completes onboarding and creates a weekly report", async ({ page }) => {
  const stamp = Date.now();
  const memberName = `Member Flow ${stamp}`;
  const memberEmail = `member-flow-${stamp}@example.com`;
  const projectName = `Member Project ${stamp}`;
  const code = `MBF${stamp}`.slice(0, 24);

  // 1. Admin creates a QA member + a project, then assigns the member.
  await loginAdmin(page);

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

  // 2. Member first login -> forced change password.
  await page.goto("/login");
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/change-password", { timeout: 15_000 });
  await page.getByLabel("Password Baru").fill(MEMBER_PASSWORD);
  await page.getByLabel("Konfirmasi Password").fill(MEMBER_PASSWORD);
  await page.getByRole("button", { name: /simpan password baru/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  // 3. Member creates a weekly report for the assigned project.
  await page.goto("/weekly-reports");
  await page.getByRole("link", { name: /new report/i }).click();
  await page.waitForURL("**/weekly-reports/new");

  await page.getByLabel("Project").selectOption({ label: projectName });
  await page.getByLabel("Week start").fill("2026-05-04");
  await page.getByLabel("Week end").fill("2026-05-10");
  await page.getByLabel("Summary item 1", { exact: true }).fill("QA member weekly progress.");
  await page.getByLabel("Test case BE total").fill("60");
  await page.getByLabel("Test case BE executed").fill("50");
  await page.getByLabel("Test case FE total").fill("40");
  await page.getByLabel("Test case FE executed").fill("40");
  await page.getByLabel("Automation BE total").fill("20");
  await page.getByLabel("Automation FE total").fill("20");
  await page.getByLabel("Automation passed").fill("35");
  await page.getByLabel("Automation failed").fill("5");
  await page.getByLabel("Next week plan item 1", { exact: true }).fill("Finish remaining backend cases.");
  await page.getByRole("button", { name: /save draft/i }).click();

  await page.waitForURL("**/weekly-reports");
  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await expect(reportRow).toBeVisible({ timeout: 15_000 });
  await expect(reportRow.getByText("Draft")).toBeVisible();

  // 4. Member submits the report.
  await reportRow.getByRole("link", { name: "View" }).click();
  await expect(page.getByRole("heading", { name: "Weekly report" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /submit report/i }).click();
  await expect(page.getByText("Submitted")).toBeVisible({ timeout: 15_000 });
});
