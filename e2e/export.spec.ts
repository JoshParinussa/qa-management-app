import { test, expect } from "@playwright/test";
import { loginAs, SEEDED } from "./helpers";

test("lead can download monthly markdown export", async ({ page }) => {
  await loginAs(page, SEEDED.lead.email);
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
