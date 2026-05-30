import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jopa@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

test("admin can create a project", async ({ page }) => {
  await loginAdmin(page);

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
  await loginAdmin(page);

  // First create a project to edit
  const stamp = Date.now();
  const code = `EDIT${stamp}`.slice(0, 24);
  const name = `Edit Target ${stamp}`;
  const renamed = `Renamed ${stamp}`;

  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");

  // Open detail of the project we just created
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
  await loginAdmin(page);

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
