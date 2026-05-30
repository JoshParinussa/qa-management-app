import { describe, expect, it } from "vitest";
import { weeklyReportSchema } from "./weekly-report";

const validBase = {
  projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
  weekStartDate: "2026-05-04",
  weekEndDate: "2026-05-10",
  summary: "Done some work",
  productionIncidentCount: 0,
  testCaseBeTotal: 100,
  testCaseBeExecuted: 80,
  testCaseFeTotal: 100,
  testCaseFeExecuted: 90,
  automationBeTotal: 50,
  automationFeTotal: 50,
  automationPassed: 90,
  automationFailed: 10,
  nextWeekPlan: "Continue work",
};

describe("weeklyReportSchema dates", () => {
  it("rejects when end date is before start date", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      weekStartDate: "2026-05-10",
      weekEndDate: "2026-05-04",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when start equals end (must be strictly before)", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      weekStartDate: "2026-05-10",
      weekEndDate: "2026-05-10",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a normal week range", () => {
    const result = weeklyReportSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});

describe("weeklyReportSchema executed limits", () => {
  it("rejects BE executed exceeding BE total", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseBeTotal: 50,
      testCaseBeExecuted: 51,
    });
    expect(result.success).toBe(false);
  });

  it("rejects FE executed exceeding FE total", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseFeTotal: 50,
      testCaseFeExecuted: 51,
    });
    expect(result.success).toBe(false);
  });
});

describe("weeklyReportSchema automation limits", () => {
  it("rejects automation total exceeding total test cases", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseBeTotal: 10,
      testCaseFeTotal: 10,
      automationBeTotal: 15,
      automationFeTotal: 15,
      testCaseBeExecuted: 0,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts automation equal to total test cases", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseBeTotal: 10,
      testCaseFeTotal: 10,
      automationBeTotal: 10,
      automationFeTotal: 10,
      testCaseBeExecuted: 0,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(true);
  });
});
