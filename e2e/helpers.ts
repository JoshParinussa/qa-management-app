import type { Page } from "@playwright/test";

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
