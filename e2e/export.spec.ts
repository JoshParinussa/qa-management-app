import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

test("lead can download monthly markdown export", async ({ page }) => {
  await login(page, "lead@example.com");
  await page.goto("/monthly-reports");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /export markdown/i }).click(),
  ]);

  const filename = download.suggestedFilename();
  expect(filename).toMatch(/\.md$/);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const content = Buffer.concat(chunks).toString("utf-8");
  expect(content).toContain("# Monthly QA Report");
  expect(content).toContain("## Metrics");
});
