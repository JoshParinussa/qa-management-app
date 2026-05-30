import type { ReportStatus } from "@/types";

export type ReviewAction = "REVIEWED" | "NEED_REVISION" | "APPROVED";

export function canSubmitReport(status: ReportStatus) {
  return status === "DRAFT" || status === "NEED_REVISION";
}

export function canReviewReport(status: ReportStatus) {
  return status === "SUBMITTED";
}

export function nextStatusForAction(action: ReviewAction): ReportStatus {
  return action;
}
