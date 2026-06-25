import { expect, type Page } from "@playwright/test";

// Default password baked into seed.ts for seeded users on creation.
export const SEEDED_INITIAL_PASSWORD = "password123";

// Password yang dipakai SEMUA seeded user setelah onboarding (lihat global-setup.ts).
export const STABLE_PASSWORD = "Seeded123!";

export const SEEDED = {
  admin: { email: "jopa@example.com", name: "Jopa" },
  lead: { email: "lead@example.com", name: "QA Lead" },
  qa1: { email: "qa1@example.com", name: "QA Member 1" },
  qa2: { email: "qa2@example.com", name: "QA Member 2" },
} as const;

/**
 * Login lalu tunggu sampai dashboard. Untuk user yang sudah lewat
 * forced-change-password (mis. seeded user setelah globalSetup, atau user
 * baru yang sudah di-onboarding manual oleh test).
 */
export async function loginAs(page: Page, email: string, password: string = STABLE_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login pakai password sementara (default), lalu lewati forced-change-password
 * dengan menetapkan password baru. Mengembalikan akun ke status normal.
 */
export async function loginAndChangePassword(
  page: Page,
  email: string,
  currentPassword: string,
  newPassword: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(currentPassword);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/change-password", { timeout: 15_000 });
  await page.getByLabel("Password Baru").fill(newPassword);
  await page.getByLabel("Konfirmasi Password").fill(newPassword);
  await page.getByRole("button", { name: /simpan password baru/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function startWeeklyReportDraft(
  page: Page,
  projectName: string,
  weekStartDate = "2026-05-04",
  weekEndDate = "2026-05-10",
) {
  await page.goto("/weekly-reports");
  await page.getByRole("button", { name: /^new report$/i }).click();

  const dialog = page.getByRole("dialog", { name: "Start weekly report" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  await dialog.getByRole("combobox", { name: "Project" }).click();
  await page.getByRole("option", { name: projectName }).click();
  await dialog.getByLabel("Week start").fill(weekStartDate);
  await dialog.getByLabel("Week end").fill(weekEndDate);
  await expect(dialog.getByText(`Belum ada report untuk ${projectName}`)).toBeVisible({ timeout: 15_000 });

  await Promise.all([
    page.waitForURL(/\/weekly-reports\/[^/]+\/edit$/, { timeout: 15_000 }),
    dialog.getByRole("button", { name: /create report/i }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Edit weekly report" })).toBeVisible({ timeout: 15_000 });
}
