import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveAssignment: vi.fn(),
  listProjectMembers: vi.fn(),
  findReportForWeek: vi.fn(),
  findReportSummaryForWeek: vi.fn(),
  getReportById: vi.fn(),
  isCoAuthor: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  selectLimit: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  requireUser: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  delete: vi.fn(),
  deleteWhere: vi.fn(),
  deleteReturning: vi.fn(),
  insertActivity: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/db/client", () => ({
  db: { insert: mocks.insert, update: mocks.update, delete: mocks.delete, select: mocks.select },
}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/project-members/queries", () => ({
  findActiveAssignment: mocks.findActiveAssignment,
  listProjectMembers: mocks.listProjectMembers,
}));
vi.mock("@/lib/weekly-reports/queries", () => ({
  findReportForWeek: mocks.findReportForWeek,
  findReportSummaryForWeek: mocks.findReportSummaryForWeek,
  getReportById: mocks.getReportById,
  isCoAuthor: mocks.isCoAuthor,
}));
vi.mock("@/lib/weekly-reports/activity", async () => {
  const actual = await vi.importActual<typeof import("./activity")>("./activity");
  return {
    ...actual,
    insertActivity: mocks.insertActivity,
  };
});

import { checkExistingWeeklyReportAction, createDraftAction, createInitialWeeklyReportDraftAction, requestQaApprovalAction, updateDraftAction } from "./actions";
import { ACTIVITY_ACTIONS } from "./activity";

function validFormData() {
  const formData = new FormData();
  formData.set("projectId", "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293");
  formData.set("weekStartDate", "2026-06-01");
  formData.set("weekEndDate", "2026-06-07");
  formData.set("summary", "Done some work");
  formData.set("productionIncidentCount", "0");
  formData.set("productionIncidentNotes", "");
  formData.set("bugDocumentUrl", "https://example.test/bugs/weekly");
  formData.set("testCaseTotal", "200");
  formData.set("testCaseBeTotal", "100");
  formData.set("testCaseBeExecuted", "80");
  formData.set("testCaseFeTotal", "100");
  formData.set("testCaseFeExecuted", "90");
  formData.set("automationBeTotal", "50");
  formData.set("automationFeTotal", "50");
  formData.set("nextWeekPlan", "Continue work");
  return formData;
}

const USER_ID = "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294";
const OTHER_QA_ID = "018f0b3c-1d2e-7a3b-8c4d-5e6f70819295";

function activeAssignment(role: "QA_MEMBER" | "QA_PIC" = "QA_MEMBER") {
  return { id: "assignment-1", removedAt: null, assignmentRole: role };
}

function projectMember(userId: string, role: "QA_MEMBER" | "QA_PIC" = "QA_MEMBER") {
  return { id: `member-${userId}`, userId, name: "QA", email: "qa@example.test", assignmentRole: role, assignedAt: new Date() };
}

describe("weekly report actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findActiveAssignment.mockResolvedValue(activeAssignment());
    mocks.listProjectMembers.mockResolvedValue([projectMember(USER_ID)]);
    mocks.findReportForWeek.mockResolvedValue(null);
    mocks.findReportSummaryForWeek.mockResolvedValue(null);
    mocks.isCoAuthor.mockResolvedValue(true);
    mocks.insert.mockReturnValue({ values: mocks.insertValues });
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.select.mockReturnValue({ from: mocks.selectFrom });
    mocks.selectFrom.mockReturnValue({ where: mocks.selectWhere });
    mocks.selectWhere.mockReturnValue({ limit: mocks.selectLimit });
    mocks.selectLimit.mockResolvedValue([{ status: "ACTIVE", weeklyReportRequired: true }]);
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.delete.mockReturnValue({ where: mocks.deleteWhere });
    mocks.deleteWhere.mockReturnValue({ returning: mocks.deleteReturning });
    mocks.deleteReturning.mockResolvedValue([]);
    mocks.insertActivity.mockResolvedValue(undefined);
    mocks.requireUser.mockResolvedValue({
      id: USER_ID,
      name: "QA",
      email: "qa@example.test",
      role: "QA_MEMBER",
      mustChangePassword: false,
    });
  });

  it("backfills legacy automation aggregates from split fields and stores split coverage", async () => {
    const formData = validFormData();
    formData.set("automationBePassed", "45");
    formData.set("automationBeFailed", "5");
    formData.set("automationFePassed", "36");
    formData.set("automationFeFailed", "4");

    await expect(createDraftAction({}, formData)).rejects.toThrow("redirect:/weekly-reports");

    const reportInsert = mocks.insertValues.mock.calls[0][0];
    expect(reportInsert).toMatchObject({
      testCaseTotal: 200,
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
    expect(reportInsert.createdBy).toBe(USER_ID);
  });

  it("snapshots all active project members as co-authors and logs CREATED activity", async () => {
    mocks.listProjectMembers.mockResolvedValue([
      projectMember(USER_ID, "QA_PIC"),
      projectMember(OTHER_QA_ID, "QA_MEMBER"),
    ]);

    await expect(createDraftAction({}, validFormData())).rejects.toThrow("redirect:/weekly-reports");

    // calls[0] is weeklyReports insert; calls[1] is reportAuthors insert.
    const authorRows = mocks.insertValues.mock.calls[1][0];
    expect(Array.isArray(authorRows)).toBe(true);
    expect(authorRows).toHaveLength(2);
    expect(authorRows.map((r: { userId: string }) => r.userId).sort()).toEqual([USER_ID, OTHER_QA_ID].sort());

    expect(mocks.insertActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTIONS.CREATED, actorId: USER_ID }),
    );
  });

  it("appends the creator as co-author when they are not in the active member list", async () => {
    mocks.listProjectMembers.mockResolvedValue([projectMember(OTHER_QA_ID)]);

    await expect(createDraftAction({}, validFormData())).rejects.toThrow("redirect:/weekly-reports");

    const authorRows = mocks.insertValues.mock.calls[1][0];
    expect(authorRows).toHaveLength(2);
    expect(authorRows.map((r: { userId: string }) => r.userId).sort()).toEqual([USER_ID, OTHER_QA_ID].sort());
  });

  it("rejects new drafts for projects that do not require weekly reports", async () => {
    mocks.selectLimit.mockResolvedValue([{ status: "ACTIVE", weeklyReportRequired: false }]);

    const result = await createDraftAction({}, validFormData());

    expect(result.error).toMatch(/tidak mewajibkan weekly report/i);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns the existing report when creating a duplicate draft", async () => {
    mocks.findReportForWeek.mockResolvedValue({
      id: "report-existing",
      status: "DRAFT",
    });

    const result = await createDraftAction({}, validFormData());

    expect(result.error).toMatch(/sudah ada/i);
    expect(result.reportConflict).toEqual({
      type: "report",
      report: {
        id: "report-existing",
        status: "DRAFT",
        canEdit: true,
      },
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("checks existing reports for the selected project and week", async () => {
    mocks.findReportSummaryForWeek.mockResolvedValue({
      id: "report-existing",
      status: "PENDING_QA_APPROVAL",
      createdByName: "QA Member 1",
      createdByEmail: "qa1@example.test",
      createdAt: new Date("2026-06-01T07:00:00.000Z"),
    });

    const result = await checkExistingWeeklyReportAction(
      "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      "2026-06-01",
      "2026-06-07",
    );

    expect(result).toEqual({
      type: "report",
      report: {
        id: "report-existing",
        status: "PENDING_QA_APPROVAL",
        createdByName: "QA Member 1",
        createdByEmail: "qa1@example.test",
        createdAt: new Date("2026-06-01T07:00:00.000Z"),
        canEdit: true,
      },
    });
  });

  it("does not reveal existing report checks to users outside the project", async () => {
    mocks.findActiveAssignment.mockResolvedValue(null);

    const result = await checkExistingWeeklyReportAction(
      "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      "2026-06-01",
      "2026-06-07",
    );

    expect(result).toBeNull();
    expect(mocks.findReportForWeek).not.toHaveBeenCalled();
    expect(mocks.findReportSummaryForWeek).not.toHaveBeenCalled();
  });

  it("creates an initial DRAFT before opening the long report form", async () => {
    const result = await createInitialWeeklyReportDraftAction(
      "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      "2026-06-01",
      "2026-06-07",
    );

    expect(result.href).toMatch(/^\/weekly-reports\/.+\/edit$/);
    expect(mocks.insert).toHaveBeenCalled();
    const reportInsert = mocks.insertValues.mock.calls[0][0];
    expect(reportInsert).toMatchObject({
      projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      createdBy: USER_ID,
      status: "DRAFT",
      summary: "",
      nextWeekPlan: "",
    });
    const authorRows = mocks.insertValues.mock.calls[1][0];
    expect(authorRows).toEqual([
      expect.objectContaining({
        userId: USER_ID,
      }),
    ]);
    expect(mocks.insertActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTIONS.CREATED, actorId: USER_ID }),
    );
  });

  it("clears nullable split fields on update when omitted from the form", async () => {
    const formData = validFormData();
    formData.set("automationPassed", "12");
    formData.set("automationFailed", "3");
    mocks.getReportById.mockResolvedValue({
      id: "report-1",
      createdBy: USER_ID,
      status: "DRAFT",
      summary: "old",
      nextWeekPlan: "old",
    });

    await expect(updateDraftAction("report-1", {}, formData)).rejects.toThrow("redirect:/weekly-reports/report-1");

    const updateValues = mocks.updateSet.mock.calls[0][0];
    expect(updateValues).toMatchObject({
      testCaseTotal: 200,
      automationBePassed: null,
      automationBeFailed: null,
      automationFePassed: null,
      automationFeFailed: null,
      automationPassed: 12,
      automationFailed: 3,
    });
  });

  it("rejects updates from non-co-authors", async () => {
    mocks.isCoAuthor.mockResolvedValue(false);
    mocks.getReportById.mockResolvedValue({
      id: "report-1",
      createdBy: "someone-else",
      status: "DRAFT",
      summary: "x",
      nextWeekPlan: "y",
    });

    const result = await updateDraftAction("report-1", {}, validFormData());
    expect(result.error).toMatch(/co-author/i);
  });

  it("resets approvals and reverts to DRAFT when content changes from PENDING_QA_APPROVAL", async () => {
    mocks.getReportById.mockResolvedValue({
      id: "report-1",
      createdBy: USER_ID,
      status: "PENDING_QA_APPROVAL",
      summary: "old summary",
      nextWeekPlan: "old plan",
    });
    mocks.deleteReturning.mockResolvedValue([{ id: "approval-1" }]);

    await expect(updateDraftAction("report-1", {}, validFormData())).rejects.toThrow("redirect:");

    expect(mocks.delete).toHaveBeenCalled();
    // Two update.set calls: 1) content update, 2) status revert to DRAFT
    expect(mocks.updateSet).toHaveBeenCalledTimes(2);
    const statusRevert = mocks.updateSet.mock.calls[1][0];
    expect(statusRevert.status).toBe("DRAFT");

    const activityActions = mocks.insertActivity.mock.calls.map((c) => (c[0] as { action: string }).action);
    expect(activityActions).toContain(ACTIVITY_ACTIONS.EDITED);
    expect(activityActions).toContain(ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED);
  });

  describe("requestQaApprovalAction", () => {
    it("transitions DRAFT to PENDING_QA_APPROVAL and logs activity", async () => {
      mocks.getReportById.mockResolvedValue({
        id: "report-1",
        createdBy: USER_ID,
        status: "DRAFT",
        summary: "ok",
        nextWeekPlan: "ok",
      });

      await expect(requestQaApprovalAction("report-1")).rejects.toThrow("redirect:/weekly-reports/report-1");

      const updateValues = mocks.updateSet.mock.calls[0][0];
      expect(updateValues.status).toBe("PENDING_QA_APPROVAL");
      expect(mocks.insertActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: ACTIVITY_ACTIONS.QA_APPROVAL_REQUESTED }),
      );
    });

    it("rejects when summary is empty", async () => {
      mocks.getReportById.mockResolvedValue({
        id: "report-1",
        createdBy: USER_ID,
        status: "DRAFT",
        summary: "",
        nextWeekPlan: "ok",
      });

      const result = await requestQaApprovalAction("report-1");
      expect(result.error).toMatch(/summary/i);
    });

    it("rejects when status is not DRAFT", async () => {
      mocks.getReportById.mockResolvedValue({
        id: "report-1",
        createdBy: USER_ID,
        status: "PENDING_QA_APPROVAL",
        summary: "ok",
        nextWeekPlan: "ok",
      });

      const result = await requestQaApprovalAction("report-1");
      expect(result.error).toMatch(/tidak bisa/i);
    });

    it("rejects when user is not a co-author", async () => {
      mocks.isCoAuthor.mockResolvedValue(false);
      mocks.getReportById.mockResolvedValue({
        id: "report-1",
        createdBy: "someone",
        status: "DRAFT",
        summary: "ok",
        nextWeekPlan: "ok",
      });

      const result = await requestQaApprovalAction("report-1");
      expect(result.error).toMatch(/co-author/i);
    });
  });
});
