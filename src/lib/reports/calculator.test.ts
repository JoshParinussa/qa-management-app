import { describe, expect, it } from "vitest";
import { calculateReportMetrics } from "./calculator";

const base = {
  testCaseTotal: 0,
  testCaseBeTotal: 0,
  testCaseFeTotal: 0,
  testCaseBeExecuted: 0,
  testCaseFeExecuted: 0,
  automationBeTotal: 0,
  automationFeTotal: 0,
  automationBePassed: 0,
  automationBeFailed: 0,
  automationFePassed: 0,
  automationFeFailed: 0,
  automationPassed: 0,
  automationFailed: 0,
};

describe("calculateReportMetrics", () => {
  it("computes coverage with normal values", () => {
    const result = calculateReportMetrics({
      testCaseTotal: 200,
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

  it("uses a provided zero test case total", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseTotal: 0,
      testCaseBeTotal: 100,
      testCaseFeTotal: 40,
    });

    expect(result.totalTestCase).toBe(0);
  });

  it("rounds coverage to two decimals", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseBeTotal: 3,
      testCaseBeExecuted: 1,
    });

    expect(result.executionCoverage).toBe(33.33);
  });

  it("computes split automation coverage and pass rates", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseTotal: 120,
      testCaseBeTotal: 100,
      testCaseFeTotal: 40,
      automationBeTotal: 50,
      automationFeTotal: 20,
      automationBePassed: 45,
      automationBeFailed: 5,
      automationFePassed: 18,
      automationFeFailed: 2,
    });

    expect(result.totalTestCase).toBe(120);
    expect(result.totalAutomation).toBe(70);
    expect(result.totalAutomationRun).toBe(70);
    expect(result.automationBeCoverage).toBe(50);
    expect(result.automationFeCoverage).toBe(50);
    expect(result.automationBePassRate).toBe(90);
    expect(result.automationFePassRate).toBe(90);
  });

  it("uses explicit zero split automation runs over stale legacy values", () => {
    const result = calculateReportMetrics({
      ...base,
      automationBePassed: 0,
      automationBeFailed: 0,
      automationFePassed: 0,
      automationFeFailed: 0,
      automationPassed: 10,
      automationFailed: 5,
    });

    expect(result.totalAutomationRun).toBe(0);
    expect(result.automationPassRate).toBe(0);
  });

  it("treats nullable database values as omitted legacy fields", () => {
    const result = calculateReportMetrics({
      ...base,
      testCaseTotal: null,
      testCaseBeTotal: 100,
      testCaseFeTotal: 40,
      automationBePassed: null,
      automationBeFailed: null,
      automationFePassed: null,
      automationFeFailed: null,
      automationPassed: 10,
      automationFailed: 5,
    });

    expect(result.totalTestCase).toBe(140);
    expect(result.totalAutomationRun).toBe(15);
  });
});
