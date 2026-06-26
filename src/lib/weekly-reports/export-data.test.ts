import { describe, expect, it } from "vitest";
import {
  buildWeeklyReportsExportData,
  weeklyExportFilename,
  type WeeklyReportExportRow,
} from "./export-data";

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

describe("buildWeeklyReportsExportData", () => {
  it("carries filter labels and report count", () => {
    const data = buildWeeklyReportsExportData({
      projectLabel: "Payment Gateway",
      statusLabel: "Approved",
      periodLabel: "1 Jun 2026 – 30 Jun 2026",
      reports: [makeReport()],
    });

    expect(data.projectLabel).toBe("Payment Gateway");
    expect(data.statusLabel).toBe("Approved");
    expect(data.periodLabel).toBe("1 Jun 2026 – 30 Jun 2026");
    expect(data.reportCount).toBe(1);
    expect(data.reports).toHaveLength(1);
  });

  it("defaults the period label to All time", () => {
    const data = buildWeeklyReportsExportData({
      projectLabel: "All projects",
      statusLabel: "All status",
      reports: [],
    });

    expect(data.periodLabel).toBe("All time");
    expect(data.reportCount).toBe(0);
    expect(data.reports).toEqual([]);
  });

  it("builds a section with week range, status, and metrics", () => {
    const [section] = buildWeeklyReportsExportData({
      projectLabel: "All projects",
      statusLabel: "All status",
      reports: [makeReport()],
    }).reports;

    expect(section.title).toBe("Payment Gateway");
    expect(section.weekRange).toBe("1 Jun 2026 → 7 Jun 2026");
    expect(section.status).toBe("Approved");
    expect(section.summary).toEqual(["Regression done", "Smoke passed"]);

    const byLabel = Object.fromEntries(section.metrics.map((m) => [m.label, m.value]));
    expect(byLabel["Total test case"]).toBe("100");
    expect(byLabel["BE automation coverage"]).toBe("50%");
    expect(byLabel["FE pass rate"]).toBe("90%");
  });

  it("parses production incidents and bug document", () => {
    const [section] = buildWeeklyReportsExportData({
      projectLabel: "All projects",
      statusLabel: "All status",
      reports: [
        makeReport({
          productionIncidentCount: 1,
          productionIncidentNotes: JSON.stringify([
            { title: "Login outage", description: "Token expired early", relatedTestCaseId: "TC-12" },
          ]),
          bugDocumentUrl: "https://docs.example.com/bug",
        }),
      ],
    }).reports;

    expect(section.incidentCount).toBe(1);
    expect(section.incidents[0].title).toBe("Login outage");
    expect(section.incidents[0].description).toBe("Token expired early");
    expect(section.bugDocumentUrl).toBe("https://docs.example.com/bug");
  });

  it("falls back to empty bullet arrays and dash notes", () => {
    const [section] = buildWeeklyReportsExportData({
      projectLabel: "All projects",
      statusLabel: "All status",
      reports: [makeReport({ blocker: null, notes: null })],
    }).reports;

    expect(section.blocker).toEqual([]);
    expect(section.notes).toBe("-");
  });
});

describe("weeklyExportFilename", () => {
  it("builds a .pdf filename from project and status labels", () => {
    expect(weeklyExportFilename("Payment Gateway", "Approved")).toMatch(
      /^weekly-reports-payment-gateway-approved-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
  });

  it("falls back to all when labels slug to empty", () => {
    expect(weeklyExportFilename("All projects", "All status")).toMatch(
      /^weekly-reports-all-projects-all-status-\d{4}-\d{2}-\d{2}\.pdf$/,
    );
  });
});
