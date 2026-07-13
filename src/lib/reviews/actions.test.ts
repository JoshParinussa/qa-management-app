import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertActivity: vi.fn(),
  revalidatePath: vi.fn(),
  requireUser: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/db/client", () => ({
  db: { update: mocks.update },
}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/weekly-reports/activity", async () => {
  const actual = await vi.importActual<typeof import("@/lib/weekly-reports/activity")>("@/lib/weekly-reports/activity");
  return {
    ...actual,
    insertActivity: mocks.insertActivity,
  };
});

import { bulkApproveReportsAction } from "./actions";
import { ACTIVITY_ACTIONS } from "@/lib/weekly-reports/activity";

const REVIEWER = {
  id: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294",
  name: "Lead",
  email: "lead@example.test",
  role: "QA_LEAD",
  mustChangePassword: false,
};

describe("review actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue(REVIEWER);
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
    mocks.updateReturning.mockResolvedValue([{ id: "report-1" }, { id: "report-2" }]);
    mocks.insertActivity.mockResolvedValue(undefined);
  });

  describe("bulkApproveReportsAction", () => {
    it("approves only submitted reports and logs approval activity", async () => {
      const result = await bulkApproveReportsAction(["report-1", "report-2", "report-2"]);

      expect(result).toMatchObject({ approvedCount: 2, skippedCount: 0 });
      expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({
        status: "APPROVED",
        reviewedBy: REVIEWER.id,
        approvedBy: REVIEWER.id,
      }));
      expect(mocks.insertActivity).toHaveBeenCalledTimes(2);
      expect(mocks.insertActivity).toHaveBeenCalledWith(expect.objectContaining({
        weeklyReportId: "report-1",
        actorId: REVIEWER.id,
        action: ACTIVITY_ACTIONS.APPROVED,
      }));
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/weekly-reports");
    });

    it("reports skipped rows when selected reports are no longer submitted", async () => {
      mocks.updateReturning.mockResolvedValue([{ id: "report-1" }]);

      const result = await bulkApproveReportsAction(["report-1", "report-2"]);

      expect(result).toMatchObject({ approvedCount: 1, skippedCount: 1 });
      expect(result.success).toContain("1 report dilewati");
      expect(mocks.insertActivity).toHaveBeenCalledTimes(1);
    });

    it("rejects empty selections", async () => {
      const result = await bulkApproveReportsAction([]);

      expect(result.error).toMatch(/pilih minimal satu/i);
      expect(mocks.update).not.toHaveBeenCalled();
    });
  });
});
