import { test, expect } from "@playwright/test";

test("admin can login and reach dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("jopa@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
