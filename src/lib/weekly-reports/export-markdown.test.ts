import { describe, expect, it } from "vitest";
import {
  buildWeeklyReportsMarkdown,
  weeklyExportFilename,
  type WeeklyReportExportRow,
} from "./export-markdown";

function makeReport(overrides: Partial<WeeklyReportExportRow> = {}): WeeklyReportExportRow {
  return {
    projectName: "Payment Gateway",
    weekStartDate: new Date("2026-06-01T00:00:00.000Z"),
    weekEndDate: new Date("2026-06-07T00:00:00.000Z"),
    status: "APPROVED",
    reviewerName: "Lead QA",
    approverName: "Lead QA",
    summary: JSON.stringify(["Regression done", "Smoke passed"]),
    testCaseTotal: 100,
    testCaseBeTotal: 40,
    testCaseBeExecuted: 40,
    testCaseFeTotal: 60,
    testCaseFeExecuted: 60,
    automationBeTotal: 20,
    automationFeTotal: 30,
    automationBePassed: 18,
    automationBeFailed: 2,
    automationFePassed: 27,
    automationFeFailed: 3,
    automationPassed: 45,
    automationFailed: 5,
    productionIncidentCount: 0,
    productionIncidentNotes: null,
    bugDocumentUrl: null,
    blocker: JSON.stringify(["Waiting for staging env"]),
    nextWeekPlan: JSON.stringify(["Start API automation"]),
    notes: "All good",
    ...overrides,
  };
}

describe("buildWeeklyReportsMarkdown", () => {
  it("includes scope name and period header", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [makeReport()],
    });

    expect(md).toContain("# Weekly QA Reports");
    expect(md).toContain("Payment Gateway");
    expect(md).toContain("2026-06-01");
    expect(md).toContain("2026-06-30");
    expect(md).toContain("## Reports (1)");
  });

  it("renders a per-report heading with project and week dates", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [makeReport()],
    });

    expect(md).toContain("### Payment Gateway — 1 Jun 2026 → 7 Jun 2026");
    expect(md).toContain("Reviewed by: Lead QA");
    expect(md).toContain("Approved by: Lead QA");
  });

  it("renders metrics computed from report inputs", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [makeReport()],
    });

    expect(md).toContain("| Total test case | 100 |");
    expect(md).toContain("| BE automation coverage | 50% |");
    expect(md).toContain("| FE automation coverage | 50% |");
    expect(md).toContain("| BE pass rate | 90% |");
    expect(md).toContain("| FE pass rate | 90% |");
  });

  it("renders summary, blocker and next plan bullets", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [makeReport()],
    });

    expect(md).toContain("- Regression done");
    expect(md).toContain("- Waiting for staging env");
    expect(md).toContain("- Start API automation");
  });

  it("falls back to placeholder when blocker is empty", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [makeReport({ blocker: null })],
    });

    expect(md).toContain("- Tidak ada blocker.");
  });

  it("renders production incidents with title and description", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "Payment Gateway",
      reports: [
        makeReport({
          productionIncidentCount: 1,
          productionIncidentNotes: JSON.stringify([
            { title: "Login outage", description: "Token expired early", relatedTestCaseId: "TC-12" },
          ]),
          bugDocumentUrl: "https://docs.example.com/bug",
        }),
      ],
    });

    expect(md).toContain("Login outage");
    expect(md).toContain("Token expired early");
    expect(md).toContain("https://docs.example.com/bug");
  });

  it("handles an empty report set", () => {
    const md = buildWeeklyReportsMarkdown({
      from: "2026-06-01",
      to: "2026-06-30",
      projectName: "All projects",
      reports: [],
    });

    expect(md).toContain("## Reports (0)");
    expect(md).toContain("Tidak ada approved report pada periode ini.");
  });
});

describe("weeklyExportFilename", () => {
  it("builds filename from project name and range", () => {
    expect(weeklyExportFilename("Payment Gateway", "2026-06-01", "2026-06-30")).toBe(
      "payment-gateway-2026-06-01-to-2026-06-30.md",
    );
  });

  it("uses all-projects when no project name", () => {
    expect(weeklyExportFilename(undefined, "2026-06-01", "2026-06-30")).toBe(
      "all-projects-2026-06-01-to-2026-06-30.md",
    );
  });
});
