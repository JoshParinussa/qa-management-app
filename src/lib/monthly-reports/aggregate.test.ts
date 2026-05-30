import { describe, expect, it } from "vitest";
import { filterApprovedInMonth, summarizeMonthlyReports } from "./aggregate";

const reports = [
  {
    status: "APPROVED" as const,
    weekStartDate: new Date("2026-05-04"),
    productionIncidentCount: 1,
    testCaseBeTotal: 100,
    testCaseFeTotal: 80,
    automationBeTotal: 40,
    automationFeTotal: 30,
    automationCoverage: "50.00",
    executionCoverage: "90.00",
    blocker: "Flaky test",
    nextWeekPlan: "Continue",
  },
  {
    status: "APPROVED" as const,
    weekStartDate: new Date("2026-05-11"),
    productionIncidentCount: 2,
    testCaseBeTotal: 20,
    testCaseFeTotal: 20,
    automationBeTotal: 10,
    automationFeTotal: 10,
    automationCoverage: "60.00",
    executionCoverage: "80.00",
    blocker: null,
    nextWeekPlan: "Wrap up",
  },
  {
    status: "DRAFT" as const,
    weekStartDate: new Date("2026-05-18"),
    productionIncidentCount: 5,
    testCaseBeTotal: 999,
    testCaseFeTotal: 999,
    automationBeTotal: 0,
    automationFeTotal: 0,
    automationCoverage: null,
    executionCoverage: null,
    blocker: "Should be excluded",
    nextWeekPlan: "Excluded",
  },
];

describe("filterApprovedInMonth", () => {
  it("keeps only approved reports inside the month", () => {
    const result = filterApprovedInMonth(reports, "2026-05");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === "APPROVED")).toBe(true);
  });

  it("excludes reports outside the month", () => {
    const result = filterApprovedInMonth(reports, "2026-04");
    expect(result).toHaveLength(0);
  });
});

describe("summarizeMonthlyReports", () => {
  it("sums totals and averages coverage from approved reports only", () => {
    const approved = filterApprovedInMonth(reports, "2026-05");
    const summary = summarizeMonthlyReports(approved);

    expect(summary.productionIncident).toBe(3);
    expect(summary.testCaseBe).toBe(120);
    expect(summary.testCaseFe).toBe(100);
    expect(summary.automationBe).toBe(50);
    expect(summary.automationFe).toBe(40);
    expect(summary.avgAutomation).toBe(55);
    expect(summary.avgExecution).toBe(85);
    expect(summary.blockers).toEqual(["Flaky test"]);
    expect(summary.nextPlans).toEqual(["Continue", "Wrap up"]);
    expect(summary.reportCount).toBe(2);
  });

  it("returns zeroed summary for empty input", () => {
    const summary = summarizeMonthlyReports([]);
    expect(summary.reportCount).toBe(0);
    expect(summary.avgAutomation).toBe(0);
  });
});
