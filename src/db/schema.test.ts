import { describe, expect, it } from "vitest";
import { projects, weeklyReports } from "./schema";

describe("weeklyReports schema", () => {
  it("keeps new optional input columns nullable without database defaults", () => {
    const optionalInputColumns = [
      weeklyReports.testCaseTotal,
      weeklyReports.automationBePassed,
      weeklyReports.automationBeFailed,
      weeklyReports.automationFePassed,
      weeklyReports.automationFeFailed,
    ];

    for (const column of optionalInputColumns) {
      expect(column.notNull).toBe(false);
      expect(column.default).toBeUndefined();
    }
  });
});

describe("projects schema", () => {
  it("requires weekly reporting by default", () => {
    expect(projects.weeklyReportRequired.notNull).toBe(true);
    expect(projects.weeklyReportRequired.default).toBe(true);
    expect(projects.weeklyReportDisabledReason.notNull).toBe(false);
  });
});
