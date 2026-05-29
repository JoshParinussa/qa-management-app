import type { ReportStatus } from "@/types";

export function canSubmitReport(status: ReportStatus) {
  return status === "DRAFT" || status === "NEED_REVISION";
}
