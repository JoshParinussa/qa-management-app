import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getUserById: vi.fn(),
  update: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  reconcileReportsAfterUserDeactivation: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/db/client", () => ({ db: { update: mocks.update } }));
vi.mock("@/lib/auth/session", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/users/queries", () => ({
  countActiveAdmins: vi.fn(),
  getUserById: mocks.getUserById,
}));
vi.mock("@/lib/users/defaults", () => ({ getDefaultPassword: () => "TestPassword123!" }));
vi.mock("@/lib/weekly-reports/approval-workflow", () => ({
  reconcileReportsAfterUserDeactivation: mocks.reconcileReportsAfterUserDeactivation,
}));

import { updateUserAction } from "./actions";

function userFormData(isActive: boolean) {
  const formData = new FormData();
  formData.set("name", "QA Member");
  formData.set("email", "qa@example.test");
  formData.set("role", "QA_MEMBER");
  if (isActive) formData.set("isActive", "on");
  return formData;
}

describe("user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mocks.getUserById.mockResolvedValue({ id: "user-1", isActive: true });
    mocks.update.mockReturnValue({ set: mocks.updateSet });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.reconcileReportsAfterUserDeactivation.mockResolvedValue(undefined);
  });

  it("reconciles pending approvals when an active user becomes inactive", async () => {
    await expect(updateUserAction("user-1", {}, userFormData(false))).rejects.toThrow("redirect:/users");

    expect(mocks.reconcileReportsAfterUserDeactivation).toHaveBeenCalledWith("user-1", "admin-1");
  });

  it("does not reconcile approvals when the user remains active", async () => {
    await expect(updateUserAction("user-1", {}, userFormData(true))).rejects.toThrow("redirect:/users");

    expect(mocks.reconcileReportsAfterUserDeactivation).not.toHaveBeenCalled();
  });
});
