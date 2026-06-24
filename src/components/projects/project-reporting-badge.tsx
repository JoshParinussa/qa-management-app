import { Badge } from "@/components/ui/badge";
import type { WeeklyReportDisabledReason } from "@/types";

const disabledReasonLabels: Record<WeeklyReportDisabledReason, string> = {
  MAINTENANCE_ONLY: "Maintenance only",
  NO_ACTIVE_QA: "No active QA",
  PROJECT_PAUSED: "Project paused",
  OTHER: "Other",
};

export function formatWeeklyReportDisabledReason(reason?: string | null) {
  if (!reason) return "Not required";
  return disabledReasonLabels[reason as WeeklyReportDisabledReason] ?? "Not required";
}

export function ProjectReportingBadge({
  reason,
  required,
}: {
  reason?: string | null;
  required: boolean;
}) {
  if (required) {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Report required
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
      {formatWeeklyReportDisabledReason(reason)}
    </Badge>
  );
}
