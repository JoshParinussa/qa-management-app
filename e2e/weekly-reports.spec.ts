import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

async function createProject(page: import("@playwright/test").Page, name: string, code: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");
}

async function assignSelfToProject(page: import("@playwright/test").Page, projectName: string) {
  await page.goto("/projects");
  const row = page.getByRole("row").filter({ hasText: projectName });
  await Promise.all([
    page.waitForURL(
      (url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new",
      { timeout: 15_000 },
    ),
    row.getByRole("link", { name: "View" }).click(),
  ]);
  // Assign QA Lead (punya report:create) ke project
  await page.getByLabel("User").selectOption({ label: "QA Lead (lead@example.com)" });
  await page.getByRole("button", { name: /^assign$/i }).click();
  await expect(page.getByRole("row").filter({ hasText: "lead@example.com" })).toBeVisible({ timeout: 15_000 });
}

async function fillReportForm(page: import("@playwright/test").Page, projectName: string) {
  await page.getByLabel("Project").selectOption({ label: projectName });
  await page.getByLabel("Week start").fill("2026-05-04");
  await page.getByLabel("Week end").fill("2026-05-10");
  await page.getByLabel("summary item 1", { exact: true }).fill("Weekly QA progress summary.");
  await page.getByLabel("Test case total").fill("200");
  await page.getByLabel("Test case BE total").fill("100");
  await page.getByLabel("Test case FE total").fill("100");
  await page.getByLabel("BE total", { exact: true }).fill("50");
  await page.getByLabel("BE passed", { exact: true }).fill("45");
  await page.getByLabel("BE failed", { exact: true }).fill("5");
  await page.getByLabel("FE total", { exact: true }).fill("50");
  await page.getByLabel("FE passed", { exact: true }).fill("45");
  await page.getByLabel("FE failed", { exact: true }).fill("5");
  await page.getByLabel("Next week plan item 1", { exact: true }).fill("Continue regression suite.");
}

test("qa lead can create a draft weekly report", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Report Project ${stamp}`;
  const code = `RPT${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignSelfToProject(page, projectName);

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();

  await page.waitForURL("**/weekly-reports");
  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await expect(reportRow).toBeVisible({ timeout: 15_000 });
  await expect(reportRow.getByText("Draft")).toBeVisible();
});

test("qa lead can edit a draft report", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Edit Report ${stamp}`;
  const code = `ERP${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignSelfToProject(page, projectName);

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await reportRow.getByRole("link", { name: "View" }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: /^edit$/i }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+\/edit$/);

  const updatedSummary = `Updated summary ${stamp}`;
  await page.getByLabel("summary item 1", { exact: true }).fill(updatedSummary);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: "Weekly report" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(updatedSummary)).toBeVisible();
});

test("qa lead can submit a draft report", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Submit Project ${stamp}`;
  const code = `SBT${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignSelfToProject(page, projectName);

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await reportRow.getByRole("link", { name: "View" }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: /submit report/i }).click();

  await expect(page.getByText("Submitted")).toBeVisible({ timeout: 15_000 });
});
