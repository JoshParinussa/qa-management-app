import { describe, expect, it } from "vitest";
import {
  canApproveAsCoAuthor,
  canReviewReport,
  canRevokeApproval,
  canStartQaApproval,
  canSubmitReport,
  isTerminalStatus,
  nextStatusForAction,
} from "./transitions";

describe("canStartQaApproval", () => {
  it("allows starting from DRAFT or NEED_REVISION", () => {
    expect(canStartQaApproval("DRAFT")).toBe(true);
    expect(canStartQaApproval("NEED_REVISION")).toBe(true);
    expect(canStartQaApproval("PENDING_QA_APPROVAL")).toBe(false);
    expect(canStartQaApproval("SUBMITTED")).toBe(false);
    expect(canStartQaApproval("REVIEWED")).toBe(false);
    expect(canStartQaApproval("APPROVED")).toBe(false);
  });
});

describe("canApproveAsCoAuthor", () => {
  it("requires PENDING_QA_APPROVAL, co-author, and not yet approved", () => {
    expect(canApproveAsCoAuthor("PENDING_QA_APPROVAL", true, false)).toBe(true);
  });

  it("blocks when already approved", () => {
    expect(canApproveAsCoAuthor("PENDING_QA_APPROVAL", true, true)).toBe(false);
  });

  it("blocks when not co-author", () => {
    expect(canApproveAsCoAuthor("PENDING_QA_APPROVAL", false, false)).toBe(false);
  });

  it("blocks outside PENDING_QA_APPROVAL", () => {
    expect(canApproveAsCoAuthor("DRAFT", true, false)).toBe(false);
    expect(canApproveAsCoAuthor("SUBMITTED", true, false)).toBe(false);
    expect(canApproveAsCoAuthor("APPROVED", true, false)).toBe(false);
  });
});

describe("canRevokeApproval", () => {
  it("requires PENDING_QA_APPROVAL, co-author, and already approved", () => {
    expect(canRevokeApproval("PENDING_QA_APPROVAL", true, true)).toBe(true);
  });

  it("blocks when not yet approved", () => {
    expect(canRevokeApproval("PENDING_QA_APPROVAL", true, false)).toBe(false);
  });

  it("blocks when not co-author", () => {
    expect(canRevokeApproval("PENDING_QA_APPROVAL", false, true)).toBe(false);
  });

  it("blocks outside PENDING_QA_APPROVAL", () => {
    expect(canRevokeApproval("DRAFT", true, true)).toBe(false);
    expect(canRevokeApproval("SUBMITTED", true, true)).toBe(false);
  });
});

describe("canSubmitReport (auto-submit from PENDING_QA_APPROVAL)", () => {
  it("only allows auto-submit from PENDING_QA_APPROVAL", () => {
    expect(canSubmitReport("PENDING_QA_APPROVAL")).toBe(true);
    expect(canSubmitReport("DRAFT")).toBe(false);
    expect(canSubmitReport("NEED_REVISION")).toBe(false);
    expect(canSubmitReport("SUBMITTED")).toBe(false);
    expect(canSubmitReport("REVIEWED")).toBe(false);
    expect(canSubmitReport("APPROVED")).toBe(false);
  });
});

describe("canReviewReport", () => {
  it("only allows reviewing a SUBMITTED report", () => {
    expect(canReviewReport("SUBMITTED")).toBe(true);
    expect(canReviewReport("DRAFT")).toBe(false);
    expect(canReviewReport("PENDING_QA_APPROVAL")).toBe(false);
    expect(canReviewReport("REVIEWED")).toBe(false);
    expect(canReviewReport("NEED_REVISION")).toBe(false);
    expect(canReviewReport("APPROVED")).toBe(false);
  });
});

describe("isTerminalStatus", () => {
  it("flags only APPROVED as terminal", () => {
    expect(isTerminalStatus("APPROVED")).toBe(true);
    expect(isTerminalStatus("DRAFT")).toBe(false);
    expect(isTerminalStatus("REVIEWED")).toBe(false);
  });
});

describe("nextStatusForAction", () => {
  it("maps review actions 1:1 to status", () => {
    expect(nextStatusForAction("REVIEWED")).toBe("REVIEWED");
    expect(nextStatusForAction("NEED_REVISION")).toBe("NEED_REVISION");
    expect(nextStatusForAction("APPROVED")).toBe("APPROVED");
  });
});
