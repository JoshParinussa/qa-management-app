import type { ReportStatus } from "@/types";
import { Badge } from "./badge";
import { formatReportStatus } from "@/lib/reports/status";

const styles: Record<ReportStatus, string> = {
  DRAFT: "border-slate-200 text-slate-600",
  PENDING_QA_APPROVAL: "border-amber-200 text-amber-700",
  SUBMITTED: "border-blue-200 text-blue-700",
  REVIEWED: "border-violet-200 text-violet-700",
  NEED_REVISION: "border-amber-200 text-amber-700",
  APPROVED: "border-emerald-200 text-emerald-700",
};

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <Badge variant="outline" className={`${styles[status]} ${className ?? ""}`}>
      {formatReportStatus(status)}
    </Badge>
  );
}
