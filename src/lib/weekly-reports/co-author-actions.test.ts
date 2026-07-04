import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReportById: vi.fn(),
  isCoAuthor: vi.fn(),
  hasUserApproved: vi.fn(),
  submitReportIfApprovalComplete: vi.fn(),
  insert: vi.fn(),
  insertValues: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  delete: vi.fn(),
  deleteWhere: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  requireUser: vi.fn(),
  insertActivity: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/db/client", () => ({
  db: { insert: mocks.insert, update: mocks.update, delete: mocks.delete },
}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/weekly-reports/queries", () => ({
  getReportById: mocks.getReportById,
  isCoAuthor: mocks.isCoAuthor,
  hasUserApproved: mocks.hasUserApproved,
}));
vi.mock("@/lib/weekly-reports/approval-workflow", () => ({
  submitReportIfApprovalComplete: mocks.submitReportIfApprovalComplete,
}));
vi.mock("@/lib/weekly-reports/activity", async () => {
  const actual = await vi.importActual<typeof import("./activity")>("./activity");
  return {
    ...actual,
    insertActivity: mocks.insertActivity,
  };
});

import { approveAsCoAuthorAction, revokeMyApprovalAction } from "./co-author-actions";
import { ACTIVITY_ACTIONS } from "./activity";

const USER_ID = "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294";

describe("co-author actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: USER_ID,
      name: "QA",
      email: "qa@example.test",
      role: "QA_MEMBER",
      mustChangePassword: false,
    });
    mocks.insert.mockReturnValue({ values: mocks.insertValues });
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.delete.mockReturnValue({ where: mocks.deleteWhere });
    mocks.deleteWhere.mockResolvedValue(undefined);
    mocks.insertActivity.mockResolvedValue(undefined);
    mocks.isCoAuthor.mockResolvedValue(true);
    mocks.hasUserApproved.mockResolvedValue(false);
    mocks.submitReportIfApprovalComplete.mockResolvedValue(false);
  });

  describe("approveAsCoAuthorAction", () => {
    it("inserts an approval and logs QA_APPROVED when not last approver", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });
      await expect(approveAsCoAuthorAction("r-1")).rejects.toThrow("redirect:/weekly-reports/r-1");

      expect(mocks.insertValues).toHaveBeenCalledWith({
        weeklyReportId: "r-1",
        userId: USER_ID,
      });
      const actions = mocks.insertActivity.mock.calls.map((c) => (c[0] as { action: string }).action);
      expect(actions).toContain(ACTIVITY_ACTIONS.QA_APPROVED);
      expect(mocks.submitReportIfApprovalComplete).toHaveBeenCalledWith("r-1", USER_ID);
    });

    it("checks whether the report can auto-submit after approval", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });
      mocks.submitReportIfApprovalComplete.mockResolvedValue(true);

      await expect(approveAsCoAuthorAction("r-1")).rejects.toThrow("redirect:/weekly-reports/r-1");

      expect(mocks.submitReportIfApprovalComplete).toHaveBeenCalledWith("r-1", USER_ID);
    });

    it("rejects when not in PENDING_QA_APPROVAL", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "DRAFT" });

      const result = await approveAsCoAuthorAction("r-1");
      expect(result?.error).toBeDefined();
      expect(mocks.insertValues).not.toHaveBeenCalled();
    });

    it("rejects when not a co-author", async () => {
      mocks.isCoAuthor.mockResolvedValue(false);
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });

      const result = await approveAsCoAuthorAction("r-1");
      expect(result?.error).toBeDefined();
      expect(mocks.insertValues).not.toHaveBeenCalled();
    });

    it("rejects when already approved", async () => {
      mocks.hasUserApproved.mockResolvedValue(true);
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });

      const result = await approveAsCoAuthorAction("r-1");
      expect(result?.error).toBeDefined();
      expect(mocks.insertValues).not.toHaveBeenCalled();
    });
  });

  describe("revokeMyApprovalAction", () => {
    it("deletes the approval and logs QA_APPROVAL_REVOKED", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });
      mocks.hasUserApproved.mockResolvedValue(true);

      await expect(revokeMyApprovalAction("r-1")).rejects.toThrow("redirect:/weekly-reports/r-1");

      expect(mocks.delete).toHaveBeenCalled();
      const actions = mocks.insertActivity.mock.calls.map((c) => (c[0] as { action: string }).action);
      expect(actions).toContain(ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED);
    });

    it("rejects when not yet approved", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "PENDING_QA_APPROVAL" });
      mocks.hasUserApproved.mockResolvedValue(false);

      const result = await revokeMyApprovalAction("r-1");
      expect(result?.error).toBeDefined();
      expect(mocks.delete).not.toHaveBeenCalled();
    });

    it("rejects outside PENDING_QA_APPROVAL", async () => {
      mocks.getReportById.mockResolvedValue({ id: "r-1", status: "DRAFT" });
      mocks.hasUserApproved.mockResolvedValue(true);

      const result = await revokeMyApprovalAction("r-1");
      expect(result?.error).toBeDefined();
      expect(mocks.delete).not.toHaveBeenCalled();
    });
  });
});
