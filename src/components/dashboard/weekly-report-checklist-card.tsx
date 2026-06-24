"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatReportDate } from "@/lib/reports/format";
import type { WeeklyReportChecklistItem } from "@/lib/weekly-reports/checklist";
import type { WeeklyReportConflict } from "@/lib/weekly-reports/form-state";

type ChecklistRange = {
  from: string;
  to: string;
};

type WeeklyReportChecklistCardProps = {
  currentUserId: string;
  items: WeeklyReportChecklistItem[];
  range: ChecklistRange;
  createInitialDraft: (
    projectId: string,
    weekStartDate: string,
    weekEndDate: string,
  ) => Promise<{ error?: string; href?: string; conflict?: WeeklyReportConflict }>;
};

type ChecklistFilter = "missing" | "all" | "reported" | "actionable";

const CHECKLIST_LABELS = {
  all: "All",
  missing: "Not reported",
  reported: "Reported",
  actionable: "Assigned to me",
  required: "Required",
} as const;

export function WeeklyReportChecklistCard({ currentUserId, items, range, createInitialDraft }: WeeklyReportChecklistCardProps) {
  const [filter, setFilter] = useState<ChecklistFilter>(() => (items.some((item) => item.isMissing) ? "missing" : "all"));
  const [search, setSearch] = useState("");
  const total = items.length;
  const missing = items.filter((item) => item.isMissing).length;
  const reported = total - missing;
  const actionable = items.filter((item) => item.isMissing && canCurrentUserCreate(item, currentUserId)).length;
  const progress = total > 0 ? (reported / total) * 100 : 0;
  const visibleItems = useMemo(
    () => filterChecklistItems(items, currentUserId, filter, search),
    [currentUserId, filter, items, search],
  );

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <CardTitle>Weekly report checklist</CardTitle>
            <CardDescription>
              Mengikuti periode report: {formatRangeLabel(range)}
            </CardDescription>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[360px]">
            <HeaderMetric label={CHECKLIST_LABELS.reported} value={reported} total={total} tone="success" />
            <HeaderMetric label={CHECKLIST_LABELS.missing} value={missing} total={total} tone="warning" />
            <HeaderMetric label="Completion" value={`${Math.round(progress)}%`} tone="neutral" />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Report completion</p>
                <p className="text-xs text-muted-foreground">
                  {reported} {CHECKLIST_LABELS.reported.toLowerCase()} • {missing} {CHECKLIST_LABELS.missing.toLowerCase()} • {total} required projects
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} className="bg-slate-100" />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari project atau QA"
                className="h-9 pl-9 text-sm"
              />
            </div>

            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => {
                if (value) setFilter(value as ChecklistFilter);
              }}
              variant="outline"
              size="sm"
              className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4"
            >
              <ToggleGroupItem value="missing" className="justify-center gap-2 px-3">
                {CHECKLIST_LABELS.missing}
                <CountBadge>{missing}</CountBadge>
              </ToggleGroupItem>
              <ToggleGroupItem value="reported" className="justify-center gap-2 px-3">
                {CHECKLIST_LABELS.reported}
                <CountBadge>{reported}</CountBadge>
              </ToggleGroupItem>
              <ToggleGroupItem value="actionable" className="justify-center gap-2 px-3">
                {CHECKLIST_LABELS.actionable}
                <CountBadge>{actionable}</CountBadge>
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="justify-center gap-2 px-3">
                {CHECKLIST_LABELS.all}
                <CountBadge>{total}</CountBadge>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Belum ada active project yang wajib weekly report.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>{visibleItems.length} project</span>
              <span>Checklist</span>
            </div>
            {visibleItems.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">Tidak ada project yang cocok.</p>
            ) : (
              <div className="max-h-[22rem] divide-y overflow-y-auto">
                {visibleItems.map((item) => (
                  <ChecklistRow
                    key={item.projectId}
                    createInitialDraft={createInitialDraft}
                    item={item}
                    currentUserId={currentUserId}
                    range={range}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HeaderMetric({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number | string;
  total?: number;
  tone: "success" | "warning" | "neutral";
}) {
  const toneClass = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    neutral: "text-slate-700",
  }[tone];

  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className={`truncate text-lg font-semibold leading-none tabular-nums ${toneClass}`}>
        {value}
        {typeof value === "number" && total !== undefined ? (
          <span className="ml-1 text-xs font-medium text-muted-foreground">/ {total}</span>
        ) : null}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function CountBadge({ children }: { children: number }) {
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 group-data-[state=on]/toggle-group-item:bg-background">
      {children}
    </span>
  );
}

function ChecklistRow({
  createInitialDraft,
  currentUserId,
  item,
  range,
}: {
  createInitialDraft: WeeklyReportChecklistCardProps["createInitialDraft"];
  currentUserId: string;
  item: WeeklyReportChecklistItem;
  range: ChecklistRange;
}) {
  const canCreate = item.assignees.some((assignee) => assignee.userId === currentUserId);
  const assignees = sortAssignees(item.assignees);

  return (
    <div className="grid gap-3 px-6 py-3 md:grid-cols-[minmax(0,1.3fr)_minmax(150px,0.55fr)_auto] md:items-center">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{item.projectName}</p>
          <Badge variant="outline" className="rounded-md font-mono text-[11px] text-muted-foreground">
            {item.projectCode}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {assignees.length > 0 ? formatAssignees(assignees) : "Belum ada QA aktif"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {item.reportStatus ? (
          <>
            <CheckCircle2 className="size-4 text-emerald-600" />
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
              {CHECKLIST_LABELS.reported}
            </Badge>
            <StatusBadge status={item.reportStatus} />
          </>
        ) : (
          <>
            <AlertTriangle className="size-4 text-amber-600" />
            <Badge variant="outline" className="border-amber-200 text-amber-700">
              {CHECKLIST_LABELS.missing}
            </Badge>
          </>
        )}
      </div>

      <div className="flex justify-start gap-2 md:justify-end">
        {item.reportId ? (
          <Button asChild variant="outline" size="xs">
            <Link href={`/weekly-reports/${item.reportId}`}>
              <FileText className="size-4" />
              View
            </Link>
          </Button>
        ) : canCreate ? (
          <CreateChecklistReportButton
            createInitialDraft={createInitialDraft}
            projectId={item.projectId}
            range={range}
          />
        ) : (
          <Badge variant="outline" className="border-slate-200 text-muted-foreground">
            Assigned QA only
          </Badge>
        )}
      </div>
    </div>
  );
}

function conflictHref(conflict: WeeklyReportConflict) {
  return conflict.report.canEdit ? `/weekly-reports/${conflict.report.id}/edit` : `/weekly-reports/${conflict.report.id}`;
}

function CreateChecklistReportButton({
  createInitialDraft,
  projectId,
  range,
}: {
  createInitialDraft: WeeklyReportChecklistCardProps["createInitialDraft"];
  projectId: string;
  range: ChecklistRange;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [isNavigating, startNavigation] = useTransition();

  async function handleCreate() {
    if (creating || isNavigating) return;

    setCreating(true);
    setError("");
    try {
      const result = await createInitialDraft(projectId, range.from, range.to);
      const href = result.href ?? (result.conflict ? conflictHref(result.conflict) : "");

      if (!href) {
        setError(result.error ?? "Gagal membuat draft.");
        return;
      }

      startNavigation(() => {
        router.push(href);
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <Button type="button" size="xs" disabled={creating || isNavigating} onClick={handleCreate}>
        {creating || isNavigating ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
        {creating || isNavigating ? "Creating..." : "Create"}
      </Button>
      {error ? <p className="max-w-48 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function filterChecklistItems(
  items: WeeklyReportChecklistItem[],
  currentUserId: string,
  filter: ChecklistFilter,
  search: string,
) {
  const query = search.trim().toLowerCase();

  return items
    .filter((item) => {
      if (filter === "missing" && !item.isMissing) return false;
      if (filter === "reported" && item.isMissing) return false;
      if (filter === "actionable" && (!item.isMissing || !canCurrentUserCreate(item, currentUserId))) return false;
      if (!query) return true;

      const assigneeText = item.assignees.map((assignee) => assignee.name).join(" ");
      return `${item.projectName} ${item.projectCode} ${assigneeText}`.toLowerCase().includes(query);
    })
    .sort((left, right) => {
      const leftCreate = canCurrentUserCreate(left, currentUserId);
      const rightCreate = canCurrentUserCreate(right, currentUserId);

      if (left.isMissing !== right.isMissing) return left.isMissing ? -1 : 1;
      if (leftCreate !== rightCreate) return leftCreate ? -1 : 1;
      return left.projectName.localeCompare(right.projectName);
    });
}

function canCurrentUserCreate(item: WeeklyReportChecklistItem, currentUserId: string) {
  return item.assignees.some((assignee) => assignee.userId === currentUserId);
}

function formatRangeLabel(range: ChecklistRange) {
  return `${formatReportDate(`${range.from}T00:00:00.000Z`)} - ${formatReportDate(`${range.to}T00:00:00.000Z`)}`;
}

function formatAssignees(assignees: WeeklyReportChecklistItem["assignees"]) {
  const visible = assignees.slice(0, 2).map((assignee) => {
    const role = assignee.assignmentRole === "QA_PIC" ? "PIC" : "Member";
    return `${assignee.name} (${role})`;
  });
  const more = assignees.length - visible.length;
  return more > 0 ? `${visible.join(", ")} +${more}` : visible.join(", ");
}

function sortAssignees(assignees: WeeklyReportChecklistItem["assignees"]) {
  return [...assignees].sort((left, right) => {
    if (left.assignmentRole !== right.assignmentRole) {
      return left.assignmentRole === "QA_PIC" ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}
