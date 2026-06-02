import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

async function createProject(page: import("@playwright/test").Page, name: string, code: string) {
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForURL("**/projects");
}

async function createMemberUser(page: import("@playwright/test").Page, name: string, email: string) {
  await page.goto("/users");
  await page.getByLabel("Nama").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible({ timeout: 15_000 });
}

async function openProjectDetail(page: import("@playwright/test").Page, name: string) {
  await page.goto("/projects");
  const row = page.getByRole("row").filter({ hasText: name });
  await Promise.all([
    page.waitForURL(
      (url) => /\/projects\/[^/]+$/.test(url.pathname) && url.pathname !== "/projects/new",
      { timeout: 15_000 },
    ),
    row.getByRole("link", { name: "View" }).click(),
  ]);
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 15_000 });
}

test("admin can assign a member to a project", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const projectName = `Assign Project ${stamp}`;
  const code = `ASN${stamp}`.slice(0, 24);
  const memberName = `Assignable ${stamp}`;
  const memberEmail = `assignable-${stamp}@example.com`;

  await createMemberUser(page, memberName, memberEmail);
  await createProject(page, projectName, code);
  await openProjectDetail(page, projectName);

  await page.getByLabel("User").selectOption({ label: `${memberName} (${memberEmail})` });
  await page.getByLabel("Role", { exact: true }).selectOption("QA_MEMBER");
  await page.getByRole("button", { name: /^assign$/i }).click();

  const memberRow = page.getByRole("row").filter({ hasText: memberEmail });
  await expect(memberRow).toBeVisible({ timeout: 15_000 });
  // Role rendered sebagai <select> editable; cek value-nya QA_MEMBER.
  await expect(memberRow.getByRole("combobox")).toHaveValue("QA_MEMBER");
});

test("admin can remove an assigned member", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  const stamp = Date.now();
  const projectName = `Remove Project ${stamp}`;
  const code = `RMV${stamp}`.slice(0, 24);
  const memberName = `Removable ${stamp}`;
  const memberEmail = `removable-${stamp}@example.com`;

  await createMemberUser(page, memberName, memberEmail);
  await createProject(page, projectName, code);
  await openProjectDetail(page, projectName);

  await page.getByLabel("User").selectOption({ label: `${memberName} (${memberEmail})` });
  await page.getByRole("button", { name: /^assign$/i }).click();

  const memberRow = page.getByRole("row").filter({ hasText: memberEmail });
  await expect(memberRow).toBeVisible({ timeout: 15_000 });

  await memberRow.getByRole("button", { name: /^remove$/i }).click();

  await expect(page.getByRole("row").filter({ hasText: memberEmail })).toHaveCount(0, {
    timeout: 15_000,
  });
});
