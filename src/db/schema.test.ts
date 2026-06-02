import { describe, expect, it } from "vitest";
import { weeklyReports } from "./schema";

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
