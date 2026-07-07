import { expect, test } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile navigation opens from the topbar and closes after navigation", async ({ page }) => {
  await loginAs(page, SEEDED.admin.email);

  await page.getByRole("button", { name: "Toggle sidebar" }).click();

  const navigation = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Projects" })).toBeVisible();

  await navigation.getByRole("link", { name: "Projects" }).click();

  await page.waitForURL("**/projects");
  await expect(navigation).toBeHidden();
});
