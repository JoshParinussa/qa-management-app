import { describe, expect, it } from "vitest";
import { weeklyReportSchema } from "./weekly-report";

const validBase = {
  projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
  weekStartDate: "2026-05-04",
  weekEndDate: "2026-05-10",
  summary: "Done some work",
  productionIncidentCount: 0,
  bugDocumentUrl: "https://example.test/bugs/weekly",
  testCaseTotal: 120,
  testCaseBeTotal: 100,
  testCaseBeExecuted: 80,
  testCaseFeTotal: 100,
  testCaseFeExecuted: 90,
  automationBeTotal: 50,
  automationFeTotal: 50,
  automationBePassed: 45,
  automationBeFailed: 5,
  automationFePassed: 36,
  automationFeFailed: 4,
  automationPassed: 90,
  automationFailed: 10,
  nextWeekPlan: "Continue work",
};

const currentFormOmittedFields = new Set([
  "automationBePassed",
  "automationBeFailed",
  "automationFePassed",
  "automationFeFailed",
]);

function currentFormPayload() {
  return Object.fromEntries(Object.entries(validBase).filter(([key]) => !currentFormOmittedFields.has(key)));
}

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

describe("weeklyReportSchema total test case coverage", () => {
  const noAutomation = {
    automationBeTotal: 0,
    automationFeTotal: 0,
    automationBePassed: 0,
    automationBeFailed: 0,
    automationFePassed: 0,
    automationFeFailed: 0,
    automationPassed: 0,
    automationFailed: 0,
  };

  it("rejects when BE + FE total is less than the input total test case", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      ...noAutomation,
      testCaseTotal: 100,
      testCaseBeTotal: 50,
      testCaseBeExecuted: 0,
      testCaseFeTotal: 20,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts when BE + FE total equals the input total test case", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      ...noAutomation,
      testCaseTotal: 100,
      testCaseBeTotal: 50,
      testCaseBeExecuted: 0,
      testCaseFeTotal: 50,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts when BE + FE total exceeds the input total test case", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      ...noAutomation,
      testCaseTotal: 100,
      testCaseBeTotal: 60,
      testCaseBeExecuted: 0,
      testCaseFeTotal: 60,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(true);
  });

  it("requires the total test case to be provided", () => {
    const withoutTotal = { ...validBase } as Partial<typeof validBase>;
    delete withoutTotal.testCaseTotal;
    const result = weeklyReportSchema.safeParse(withoutTotal);
    expect(result.success).toBe(false);
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
  it("rejects BE automation total exceeding BE test case total", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseBeTotal: 10,
      automationBeTotal: 15,
      testCaseBeExecuted: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects FE automation total exceeding FE test case total", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseFeTotal: 10,
      automationFeTotal: 15,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects split automation runs exceeding automation totals for both BE and FE", () => {
    const beResult = weeklyReportSchema.safeParse({
      ...validBase,
      automationBeTotal: 50,
      automationBePassed: 50,
      automationBeFailed: 1,
    });

    const feResult = weeklyReportSchema.safeParse({
      ...validBase,
      automationFeTotal: 40,
      automationFePassed: 40,
      automationFeFailed: 1,
    });

    expect(beResult.success).toBe(false);
    expect(feResult.success).toBe(false);
  });

  it("allows total test case lower than BE plus FE totals", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseTotal: 50,
      testCaseBeTotal: 100,
      testCaseFeTotal: 100,
      automationBeTotal: 50,
      automationFeTotal: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts automation equal to total test cases", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      testCaseTotal: 20,
      testCaseBeTotal: 10,
      testCaseFeTotal: 10,
      automationBeTotal: 10,
      automationFeTotal: 10,
      automationBePassed: 9,
      automationBeFailed: 1,
      automationFePassed: 9,
      automationFeFailed: 1,
      automationPassed: 18,
      automationFailed: 2,
      testCaseBeExecuted: 0,
      testCaseFeExecuted: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts current form shape without defaulting new optional fields", () => {
    const result = weeklyReportSchema.safeParse(currentFormPayload());

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Expected current form payload to be valid");
    expect("automationBePassed" in result.data).toBe(false);
    expect("automationFePassed" in result.data).toBe(false);
  });

  it("rejects current form shape when aggregate automation runs exceed automation totals", () => {
    const result = weeklyReportSchema.safeParse({
      ...currentFormPayload(),
      automationBeTotal: 10,
      automationFeTotal: 10,
      automationPassed: 999,
      automationFailed: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("weeklyReportSchema production incidents", () => {
  it("requires incident title, description, and related test case ID when incident count is greater than zero", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      productionIncidentCount: 1,
      productionIncidentNotes: JSON.stringify([
        { title: "Bug A", description: "", relatedTestCaseId: "" },
      ]),
    });

    expect(result.success).toBe(false);
  });

  it("requires incident details to match the incident count", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      productionIncidentCount: 2,
      productionIncidentNotes: JSON.stringify([
        { title: "Bug A", description: "Detail", relatedTestCaseId: "TC-1" },
      ]),
    });

    expect(result.success).toBe(false);
  });

  it("accepts complete incident details with related test case IDs", () => {
    const result = weeklyReportSchema.safeParse({
      ...validBase,
      productionIncidentCount: 1,
      productionIncidentNotes: JSON.stringify([
        { title: "Bug A", description: "Detail", relatedTestCaseId: "TC-1" },
      ]),
    });

    expect(result.success).toBe(true);
  });
});
