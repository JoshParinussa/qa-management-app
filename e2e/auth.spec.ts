import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

test("admin can login and reach dashboard", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
