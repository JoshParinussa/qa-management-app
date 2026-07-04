import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  countApprovals: vi.fn(),
  countAuthors: vi.fn(),
  listPendingReportIdsByAuthor: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
  insertActivity: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: { update: mocks.update },
}));
vi.mock("@/lib/weekly-reports/queries", () => ({
  countApprovals: mocks.countApprovals,
  countAuthors: mocks.countAuthors,
  listPendingReportIdsByAuthor: mocks.listPendingReportIdsByAuthor,
}));
vi.mock("@/lib/weekly-reports/activity", async () => {
  const actual = await vi.importActual<typeof import("./activity")>("./activity");
  return { ...actual, insertActivity: mocks.insertActivity };
});

import {
  hasAllRequiredApprovals,
  reconcileReportsAfterUserDeactivation,
  submitReportIfApprovalComplete,
} from "./approval-workflow";
import { ACTIVITY_ACTIONS } from "./activity";

describe("approval workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
    mocks.updateReturning.mockResolvedValue([{ id: "report-1" }]);
    mocks.insertActivity.mockResolvedValue(undefined);
  });

  it("requires every active co-author approval", () => {
    expect(hasAllRequiredApprovals(1, 2)).toBe(false);
    expect(hasAllRequiredApprovals(1, 1)).toBe(true);
    expect(hasAllRequiredApprovals(0, 0)).toBe(true);
  });

  it("submits when all currently-required approvals are complete", async () => {
    mocks.countApprovals.mockResolvedValue(1);
    mocks.countAuthors.mockResolvedValue(1);

    await expect(submitReportIfApprovalComplete("report-1", "actor-1")).resolves.toBe(true);

    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
      status: "SUBMITTED",
      submittedBy: "actor-1",
    }));
    expect(mocks.insertActivity).toHaveBeenCalledWith(expect.objectContaining({
      weeklyReportId: "report-1",
      actorId: "actor-1",
      action: ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER,
    }));
  });

  it("keeps the report pending while an active approval is missing", async () => {
    mocks.countApprovals.mockResolvedValue(1);
    mocks.countAuthors.mockResolvedValue(2);

    await expect(submitReportIfApprovalComplete("report-1", "actor-1")).resolves.toBe(false);

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insertActivity).not.toHaveBeenCalled();
  });

  it("rechecks pending reports when a co-author becomes inactive", async () => {
    mocks.listPendingReportIdsByAuthor.mockResolvedValue([{ id: "report-1" }]);
    mocks.countApprovals.mockResolvedValue(1);
    mocks.countAuthors.mockResolvedValue(1);

    await reconcileReportsAfterUserDeactivation("inactive-user", "admin-user");

    expect(mocks.countAuthors).toHaveBeenCalledWith("report-1");
    expect(mocks.insertActivity).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "admin-user",
      note: expect.stringMatching(/inactive/i),
    }));
  });

  it("submits when no active co-author approval remains required", async () => {
    mocks.countApprovals.mockResolvedValue(0);
    mocks.countAuthors.mockResolvedValue(0);

    await expect(submitReportIfApprovalComplete("report-1", "admin-user")).resolves.toBe(true);

    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "SUBMITTED" }));
  });
});
