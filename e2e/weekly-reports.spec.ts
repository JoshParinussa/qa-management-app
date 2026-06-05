import { test, expect, type Page } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

async function createProject(page: Page, name: string, code: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");
}

async function openProjectDetail(page: Page, projectName: string) {
  await page.goto("/projects");
  const row = page.getByRole("row").filter({ hasText: projectName });
  await Promise.all([
    page.waitForURL(
      (url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new",
      { timeout: 15_000 },
    ),
    row.getByRole("link", { name: "View" }).click(),
  ]);
}

async function assignMember(page: Page, projectName: string, userLabel: string) {
  await openProjectDetail(page, projectName);
  await page.getByLabel("User").selectOption({ label: userLabel });
  await page.getByRole("button", { name: /^assign$/i }).click();
  const emailMatch = userLabel.match(/\(([^)]+)\)/)?.[1] ?? userLabel;
  await expect(page.getByRole("row").filter({ hasText: emailMatch })).toBeVisible({ timeout: 15_000 });
}

async function fillReportForm(page: Page, projectName: string) {
  await page.getByLabel("Project").selectOption({ label: projectName });
  await page.getByLabel("Week start").fill("2026-05-04");
  await page.getByLabel("Week end").fill("2026-05-10");
  await page.getByLabel("summary item 1", { exact: true }).fill("Weekly QA progress summary.");
  await page.getByLabel("Bug document URL").fill("https://example.test/bugs/weekly");
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

async function openOwnReport(page: Page, projectName: string) {
  await page.goto("/weekly-reports");
  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await reportRow.getByRole("link", { name: "View" }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });
}

test("qa lead can create a draft weekly report", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Report Project ${stamp}`;
  const code = `RPT${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignMember(page, projectName, "QA Lead (lead@example.com)");

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
  await assignMember(page, projectName, "QA Lead (lead@example.com)");

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  await openOwnReport(page, projectName);
  await page.getByRole("link", { name: /^edit$/i }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+\/edit$/);

  const updatedSummary = `Updated summary ${stamp}`;
  await page.getByLabel("summary item 1", { exact: true }).fill(updatedSummary);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: "Weekly report" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(updatedSummary)).toBeVisible();
});

test("sole co-author auto-submits to reviewer after self-approval", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Submit Project ${stamp}`;
  const code = `SBT${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignMember(page, projectName, "QA Lead (lead@example.com)");

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  await openOwnReport(page, projectName);

  // Step 1: ajukan untuk approval QA → status PENDING_QA_APPROVAL
  await page.getByRole("button", { name: /ajukan untuk approval qa/i }).click();
  await expect(page.getByText("Pending qa approval")).toBeVisible({ timeout: 15_000 });

  // Step 2: approve sebagai co-author (sole co-author) → auto-submit ke SUBMITTED
  await page.getByRole("button", { name: /^approve$/i }).click();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible({ timeout: 15_000 });
});

test("two co-authors must both approve before report goes to reviewer", async ({ page, browser }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Multi QA ${stamp}`;
  const code = `MQA${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  // Assign QA1 first via lead's session.
  await assignMember(page, projectName, "QA Lead (lead@example.com)");
  await openProjectDetail(page, projectName);
  await page.getByLabel("User").selectOption({ label: "QA Member 1 (qa1@example.com)" });
  await page.getByRole("button", { name: /^assign$/i }).click();
  await expect(page.getByRole("row").filter({ hasText: "qa1@example.com" })).toBeVisible({ timeout: 15_000 });

  // Lead creates the draft.
  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  await openOwnReport(page, projectName);
  const reportUrl = page.url();

  // Lead requests QA approval, then approves their own slot.
  await page.getByRole("button", { name: /ajukan untuk approval qa/i }).click();
  await expect(page.getByText("Pending qa approval")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /^approve$/i }).click();
  // Still waiting for QA1 — should remain pending.
  await expect(page.getByText("Pending qa approval")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1\/2 co-author sudah approve/i)).toBeVisible();

  // QA1 logs in via a separate context and approves.
  const qa1Context = await browser.newContext();
  const qa1Page = await qa1Context.newPage();
  await loginAs(qa1Page, SEEDED.qa1.email);
  await qa1Page.goto(reportUrl);
  await qa1Page.getByRole("button", { name: /^approve$/i }).click();
  await expect(qa1Page.getByText("Submitted", { exact: true })).toBeVisible({ timeout: 15_000 });

  await qa1Context.close();

  // Lead refreshes — should now also see SUBMITTED.
  await page.reload();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible({ timeout: 15_000 });
});

test("editing a pending report resets approvals back to draft", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Reset Approval ${stamp}`;
  const code = `RST${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignMember(page, projectName, "QA Lead (lead@example.com)");

  await page.goto("/weekly-reports/new");
  await fillReportForm(page, projectName);
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  await openOwnReport(page, projectName);

  await page.getByRole("button", { name: /ajukan untuk approval qa/i }).click();
  await expect(page.getByText("Pending qa approval")).toBeVisible({ timeout: 15_000 });

  // Edit content while pending → status reverts to DRAFT, approvals cleared.
  await page.getByRole("link", { name: /^edit$/i }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+\/edit$/);
  await page.getByLabel("summary item 1", { exact: true }).fill(`After edit ${stamp}`);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await expect(page.getByText(/0\/1 co-author sudah approve/i)).toBeVisible();
});
