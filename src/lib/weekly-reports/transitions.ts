import type { ReportStatus } from "@/types";

export type ReviewAction = "REVIEWED" | "NEED_REVISION" | "APPROVED";

export function canStartQaApproval(status: ReportStatus): boolean {
  return status === "DRAFT" || status === "NEED_REVISION";
}

export function canApproveAsCoAuthor(
  status: ReportStatus,
  isCoAuthor: boolean,
  hasApproved: boolean,
): boolean {
  return status === "PENDING_QA_APPROVAL" && isCoAuthor && !hasApproved;
}

export function canRevokeApproval(
  status: ReportStatus,
  isCoAuthor: boolean,
  hasApproved: boolean,
): boolean {
  return status === "PENDING_QA_APPROVAL" && isCoAuthor && hasApproved;
}

/**
 * Auto-submit transition. Triggered server-side when the last QA approval lands.
 * No user-facing button maps to this.
 */
export function canSubmitReport(status: ReportStatus): boolean {
  return status === "PENDING_QA_APPROVAL";
}

export function canReviewReport(status: ReportStatus): boolean {
  return status === "SUBMITTED";
}

export function isTerminalStatus(status: ReportStatus): boolean {
  return status === "APPROVED";
}

export function nextStatusForAction(action: ReviewAction): ReportStatus {
  return action;
}
