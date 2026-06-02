import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/helpers.ts", "**/global-setup.ts"],
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
