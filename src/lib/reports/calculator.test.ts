import { describe, expect, it } from "vitest";
import { calculateReportMetrics } from "./calculator";

const base = {
  testCaseBeTotal: 0,
  testCaseFeTotal: 0,
  testCaseBeExecuted: 0,
  testCaseFeExecuted: 0,
  automationBeTotal: 0,
  automationFeTotal: 0,
  automationPassed: 0,
  automationFailed: 0,
};

describe("calculateReportMetrics", () => {
  it("computes coverage with normal values", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseBeTotal: 100,
      testCaseFeTotal: 100,
      testCaseBeExecuted: 80,
      testCaseFeExecuted: 100,
      automationBeTotal: 50,
      automationFeTotal: 50,
      automationPassed: 90,
      automationFailed: 10,
    });

    expect(result.totalTestCase).toBe(200);
    expect(result.totalExecutedTestCase).toBe(180);
    expect(result.totalAutomation).toBe(100);
    expect(result.automationCoverage).toBe(50);
    expect(result.executionCoverage).toBe(90);
    expect(result.automationPassRate).toBe(90);
  });

  it("returns zero coverage when total test case is zero", () => {
    const result = calculateReportMetrics(base);

    expect(result.automationCoverage).toBe(0);
    expect(result.executionCoverage).toBe(0);
    expect(result.automationPassRate).toBe(0);
  });

  it("rounds coverage to two decimals", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseBeTotal: 3,
      testCaseBeExecuted: 1,
    });

    expect(result.executionCoverage).toBe(33.33);
  });
});
