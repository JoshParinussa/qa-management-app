import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types";

const statusStyles: Record<ProjectStatus, { label: string; badge: string; dot: string }> = {
  ACTIVE: {
    label: "Active",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  ARCHIVED: {
    label: "Archived",
    badge: "border-slate-300 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const style = statusStyles[status];

  return (
    <Badge variant="outline" className={style.badge}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </Badge>
  );
}
