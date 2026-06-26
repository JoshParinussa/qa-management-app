import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

test("admin can create a project", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  await page.goto("/projects");
  await page.getByRole("link", { name: /new project/i }).click();
  await page.waitForURL("**/projects/new");

  const stamp = Date.now();
  const code = `E2E${stamp}`.slice(0, 24);
  const name = `E2E Project ${stamp}`;

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();

  await page.waitForURL("**/projects");
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("cell", { name: code })).toBeVisible();
});

test("admin can edit a project", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const code = `EDIT${stamp}`.slice(0, 24);
  const name = `Edit Target ${stamp}`;
  const renamed = `Renamed ${stamp}`;

  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");

  const row = page.getByRole("row").filter({ hasText: name });
  await Promise.all([
    page.waitForURL((url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new", { timeout: 15_000 }),
    row.getByRole("link", { name: "View" }).click(),
  ]);
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: /^edit$/i }).click();

  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: renamed })).toBeVisible({ timeout: 15_000 });
});

test("admin can archive a project", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const code = `ARC${stamp}`.slice(0, 24);
  const name = `Archive Target ${stamp}`;

  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");

  const row = page.getByRole("row").filter({ hasText: name });
  await Promise.all([
    page.waitForURL((url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new", { timeout: 15_000 }),
    row.getByRole("link", { name: "View" }).click(),
  ]);
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /^archive$/i }).click();

  await page.waitForURL("**/projects");
  const archivedRow = page.getByRole("row").filter({ hasText: name });
  await expect(archivedRow.getByText("Archived")).toBeVisible({ timeout: 15_000 });
});

test("project detail back preserves list filters and pagination", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const prefix = `Return State ${stamp}`;

  for (let i = 1; i <= 12; i += 1) {
    await page.goto("/projects/new");
    await page.getByLabel("Name").fill(`${prefix} ${String(i).padStart(2, "0")}`);
    await page.getByLabel("Code").fill(`RET${String(stamp).slice(-8)}${String(i).padStart(2, "0")}`.slice(0, 24));
    await page.getByRole("button", { name: /create project/i }).click();
    await page.waitForURL("**/projects");
  }

  await page.goto("/projects");
  await page.getByLabel("Filter status").selectOption("ACTIVE");
  await page.getByPlaceholder("Search name or code...").fill(prefix);
  await expect(page.getByLabel("Filter status")).toHaveValue("ACTIVE");
  await expect(page.getByPlaceholder("Search name or code...")).toHaveValue(prefix);
  await page.getByRole("button", { name: "Page 2" }).click();
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");

  const pageTwoProject = `${prefix} 02`;
  const row = page.getByRole("row").filter({ hasText: pageTwoProject });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("link", { name: "View" }).click();

  await expect(page.getByRole("heading", { name: pageTwoProject })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Back to projects" }).click();

  await page.waitForURL("**/projects");
  await expect(page.getByPlaceholder("Search name or code...")).toHaveValue(prefix);
  await expect(page.getByLabel("Filter status")).toHaveValue("ACTIVE");
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("row").filter({ hasText: pageTwoProject })).toBeVisible();
});
