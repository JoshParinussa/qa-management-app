import { Badge } from "@/components/ui/badge";
import { formatReportTimestamp } from "@/lib/reports/format";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Edit3,
  FileText,
  RefreshCcw,
  Send,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type { ComponentType } from "react";

export type ActivityRow = {
  id: string;
  action: string;
  changedFields: unknown;
  note: string | null;
  createdAt: Date;
  actorId: string;
  actorName: string;
};

type ActionMeta = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

const ACTION_META: Record<string, ActionMeta> = {
  CREATED: { label: "Membuat draft", icon: FileText, tone: "neutral" },
  EDITED: { label: "Mengedit konten", icon: Edit3, tone: "neutral" },
  QA_APPROVAL_REQUESTED: { label: "Mengajukan untuk approval QA", icon: ArrowUpRight, tone: "info" },
  QA_APPROVED: { label: "Approve sebagai co-author", icon: ShieldCheck, tone: "success" },
  QA_APPROVAL_REVOKED: { label: "Approval QA dibatalkan", icon: ShieldX, tone: "warning" },
  SUBMITTED_TO_REVIEWER: { label: "Dikirim ke reviewer", icon: Send, tone: "info" },
  REVIEWED: { label: "Direview oleh QA Lead", icon: CircleDot, tone: "info" },
  REVISION_REQUESTED: { label: "Reviewer minta revisi", icon: RefreshCcw, tone: "warning" },
  APPROVED: { label: "Disetujui oleh reviewer", icon: CheckCircle2, tone: "success" },
};

const TONE_CLASSES: Record<ActionMeta["tone"], string> = {
  neutral: "text-muted-foreground border-border",
  info: "text-blue-700 border-blue-200",
  success: "text-emerald-700 border-emerald-200",
  warning: "text-amber-700 border-amber-200",
  danger: "text-destructive border-destructive/30",
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function ActivityTimeline({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <ol className="space-y-3">
      {activities.map((activity) => {
        const meta = ACTION_META[activity.action] ?? {
          label: activity.action,
          icon: CircleDot,
          tone: "neutral" as const,
        };
        const Icon = meta.icon;
        const fields = asStringArray(activity.changedFields);

        return (
          <li
            key={activity.id}
            className={`flex gap-3 rounded-lg border p-3 ${TONE_CLASSES[meta.tone]}`}
          >
            <div className="mt-0.5 shrink-0">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-foreground">{meta.label}</p>
                 <p className="text-xs text-muted-foreground">{formatReportTimestamp(activity.createdAt)}</p>
              </div>
              <p className="text-xs text-muted-foreground">oleh {activity.actorName}</p>
              {fields.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {fields.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px]">
                      {f}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {activity.note ? (
                <p className="whitespace-pre-wrap pt-1 text-xs text-foreground/80">{activity.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
