import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveAssignment: vi.fn(),
  findReportForWeek: vi.fn(),
  getReportById: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  requireUser: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/db/client", () => ({ db: { insert: mocks.insert, update: mocks.update } }));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/project-members/queries", () => ({ findActiveAssignment: mocks.findActiveAssignment }));
vi.mock("@/lib/weekly-reports/queries", () => ({
  findReportForWeek: mocks.findReportForWeek,
  getReportById: mocks.getReportById,
}));

import { createDraftAction, updateDraftAction } from "./actions";

function validFormData() {
  const formData = new FormData();
  formData.set("projectId", "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293");
  formData.set("weekStartDate", "2026-06-01");
  formData.set("weekEndDate", "2026-06-07");
  formData.set("summary", "Done some work");
  formData.set("productionIncidentCount", "0");
  formData.set("productionIncidentNotes", "");
  formData.set("bugDocumentUrl", "");
  formData.set("testCaseBeTotal", "100");
  formData.set("testCaseBeExecuted", "80");
  formData.set("testCaseFeTotal", "100");
  formData.set("testCaseFeExecuted", "90");
  formData.set("automationBeTotal", "50");
  formData.set("automationFeTotal", "50");
  formData.set("nextWeekPlan", "Continue work");
  return formData;
}

describe("weekly report actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findActiveAssignment.mockResolvedValue({ id: "assignment-1", removedAt: null });
    mocks.findReportForWeek.mockResolvedValue(null);
    mocks.insert.mockReturnValue({ values: mocks.insertValues });
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.requireUser.mockResolvedValue({
      id: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294",
      name: "QA",
      email: "qa@example.test",
      role: "QA_MEMBER",
      mustChangePassword: false,
    });
  });

  it("backfills legacy automation aggregates from split fields and stores split coverage", async () => {
    const formData = validFormData();
    formData.set("testCaseTotal", "120");
    formData.set("automationBePassed", "45");
    formData.set("automationBeFailed", "5");
    formData.set("automationFePassed", "36");
    formData.set("automationFeFailed", "4");

    await expect(createDraftAction({}, formData)).rejects.toThrow("redirect:/weekly-reports");

    expect(mocks.insertValues).toHaveBeenCalledTimes(1);
    expect(mocks.insertValues.mock.calls[0][0]).toMatchObject({
      testCaseTotal: 120,
      automationBePassed: 45,
      automationBeFailed: 5,
      automationFePassed: 36,
      automationFeFailed: 4,
      automationPassed: 81,
      automationFailed: 9,
      automationCoverage: "50",
      executionCoverage: "85",
      automationBeCoverage: "50",
      automationFeCoverage: "50",
      automationBePassRate: "90",
      automationFePassRate: "90",
    });
  });

  it("persists null nullable split fields and preserves legacy automation aggregates", async () => {
    const formData = validFormData();
    formData.set("testCaseTotal", "");
    formData.set("automationBePassed", "");
    formData.set("automationBeFailed", "");
    formData.set("automationFePassed", "");
    formData.set("automationFeFailed", "");
    formData.set("automationPassed", "12");
    formData.set("automationFailed", "3");

    await expect(createDraftAction({}, formData)).rejects.toThrow("redirect:/weekly-reports");

    expect(mocks.insertValues).toHaveBeenCalledTimes(1);
    const values = mocks.insertValues.mock.calls[0][0];
    expect(values.automationPassed).toBe(12);
    expect(values.automationFailed).toBe(3);
    expect(values.automationBeCoverage).toBe("50");
    expect(values.automationFeCoverage).toBe("50");
    expect(values.testCaseTotal).toBeNull();
    expect(values.automationBePassed).toBeNull();
    expect(values.automationBeFailed).toBeNull();
    expect(values.automationFePassed).toBeNull();
    expect(values.automationFeFailed).toBeNull();
  });

  it("uses split automation values over legacy aggregate fields when both are present", async () => {
    const formData = validFormData();
    formData.set("automationBePassed", "30");
    formData.set("automationBeFailed", "5");
    formData.set("automationFePassed", "20");
    formData.set("automationFeFailed", "10");
    formData.set("automationPassed", "999");
    formData.set("automationFailed", "999");

    await expect(createDraftAction({}, formData)).rejects.toThrow("redirect:/weekly-reports");

    expect(mocks.insertValues).toHaveBeenCalledTimes(1);
    expect(mocks.insertValues.mock.calls[0][0]).toMatchObject({
      automationBePassed: 30,
      automationBeFailed: 5,
      automationFePassed: 20,
      automationFeFailed: 10,
      automationPassed: 50,
      automationFailed: 15,
    });
  });

  it("clears nullable split fields on update when omitted from the form", async () => {
    const formData = validFormData();
    formData.set("automationPassed", "12");
    formData.set("automationFailed", "3");
    mocks.getReportById.mockResolvedValue({
      id: "report-1",
      userId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294",
      status: "DRAFT",
    });

    await expect(updateDraftAction("report-1", {}, formData)).rejects.toThrow("redirect:/weekly-reports/report-1");

    expect(mocks.updateSet).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet.mock.calls[0][0]).toMatchObject({
      testCaseTotal: null,
      automationBePassed: null,
      automationBeFailed: null,
      automationFePassed: null,
      automationFeFailed: null,
      automationPassed: 12,
      automationFailed: 3,
    });
  });
});
