import type { ReportStatus } from "@/types";

export function formatReportStatus(status: ReportStatus) {
  const lower = status.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
