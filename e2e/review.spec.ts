import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

async function createProject(page: import("@playwright/test").Page, name: string, code: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");
}

async function assignLead(page: import("@playwright/test").Page, projectName: string) {
  await page.goto("/projects");
  const row = page.getByRole("row").filter({ hasText: projectName });
  await Promise.all([
    page.waitForURL(
      (url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new",
      { timeout: 15_000 },
    ),
    row.getByRole("link", { name: "View" }).click(),
  ]);
  await page.getByLabel("User").selectOption({ label: "QA Lead (lead@example.com)" });
  await page.getByRole("button", { name: /^assign$/i }).click();
  await expect(page.getByRole("row").filter({ hasText: "lead@example.com" })).toBeVisible({ timeout: 15_000 });
}

async function createAndSubmitReport(page: import("@playwright/test").Page, projectName: string) {
  await page.goto("/weekly-reports/new");
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
  await page.getByRole("button", { name: /save draft/i }).click();
  await page.waitForURL("**/weekly-reports");

  const reportRow = page.getByRole("row").filter({ hasText: projectName });
  await reportRow.getByRole("link", { name: "View" }).click();
  await page.waitForURL(/\/weekly-reports\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Weekly report", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /submit report/i }).click();
  await expect(page.getByText("Submitted")).toBeVisible({ timeout: 15_000 });
}

test("qa lead can review and approve a submitted report", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Approve Flow ${stamp}`;
  const code = `APF${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignLead(page, projectName);
  await createAndSubmitReport(page, projectName);

  await page.getByRole("button", { name: /^approve$/i }).click();
  await expect(page.getByText("Approved")).toBeVisible({ timeout: 15_000 });
});

test("qa lead can request revision with feedback", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);

  const stamp = Date.now();
  const projectName = `Revision Flow ${stamp}`;
  const code = `RVF${stamp}`.slice(0, 24);

  await createProject(page, projectName, code);
  await assignLead(page, projectName);
  await createAndSubmitReport(page, projectName);

  await page.getByLabel("Feedback").fill("Tolong perbaiki automation coverage.");
  await page.getByRole("button", { name: /request revision/i }).click();

  await expect(page.getByText("Need revision").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Tolong perbaiki automation coverage.")).toBeVisible();
});
