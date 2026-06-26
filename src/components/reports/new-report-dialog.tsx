"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatReportDate, formatReportTimestamp } from "@/lib/reports/format";
import type { WeeklyReportConflict } from "@/lib/weekly-reports/form-state";

type ProjectOption = { id: string; name: string };

type NewReportDialogProps = {
  projects: ProjectOption[];
  checkReportConflict: (projectId: string, weekStartDate: string, weekEndDate: string) => Promise<WeeklyReportConflict | null>;
  createInitialDraft: (
    projectId: string,
    weekStartDate: string,
    weekEndDate: string,
  ) => Promise<{ error?: string; href?: string; conflict?: WeeklyReportConflict }>;
};

function lookupKey(projectId: string, weekStartDate: string, weekEndDate: string) {
  return projectId && weekStartDate && weekEndDate ? `${projectId}:${weekStartDate}:${weekEndDate}` : "";
}

function isValidRange(weekStartDate: string, weekEndDate: string) {
  return Boolean(weekStartDate && weekEndDate && weekStartDate < weekEndDate);
}

function formatCreator(conflict: WeeklyReportConflict) {
  return conflict.report.createdByName?.trim() || conflict.report.createdByEmail?.trim() || "QA lain";
}

export function NewReportDialog({ projects, checkReportConflict, createInitialDraft }: NewReportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const [reportConflict, setReportConflict] = useState<WeeklyReportConflict | null>(null);
  const [checkedKey, setCheckedKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isNavigating, startNavigation] = useTransition();

  const currentLookupKey = lookupKey(projectId, weekStartDate, weekEndDate);
  const rangeValid = isValidRange(weekStartDate, weekEndDate);
  const createDisabled = !projectId || !rangeValid || checking || creating || Boolean(reportConflict) || isNavigating;
  const selectedProjectName = useMemo(
    () => projects.find((project) => project.id === projectId)?.name,
    [projectId, projects],
  );

  useEffect(() => {
    if (!open || !projectId || !rangeValid) return;
    if (currentLookupKey === checkedKey) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setChecking(true);
      checkReportConflict(projectId, weekStartDate, weekEndDate)
        .then((conflict) => {
          if (!active) return;
          setReportConflict(conflict);
          setCheckedKey(currentLookupKey);
        })
        .finally(() => {
          if (active) setChecking(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [checkReportConflict, checkedKey, currentLookupKey, open, projectId, rangeValid, weekEndDate, weekStartDate]);

  function resetLookup() {
    setReportConflict(null);
    setCheckedKey("");
    setChecking(false);
    setCreating(false);
    setCreateError("");
  }

  async function handleCreate() {
    if (createDisabled) return;

    setCreateError("");
    setCreating(true);
    try {
      const result = await createInitialDraft(projectId, weekStartDate, weekEndDate);

      if (result.conflict) {
        setReportConflict(result.conflict);
        setCheckedKey(currentLookupKey);
        setCreateError(result.error ?? "");
        return;
      }

      if (!result.href) {
        setCreateError(result.error ?? "Gagal membuka form report.");
        return;
      }

      const href = result.href;
      startNavigation(() => {
        router.push(href);
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New report</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Start weekly report</DialogTitle>
          <DialogDescription>
            Pilih project dan periode minggu. Draft akan langsung dibuat setelah kamu klik Create report.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label id="new-report-project-label">Project</Label>
            <Select
              value={projectId}
              onValueChange={(value) => {
                setProjectId(value);
                resetLookup();
              }}
            >
              <SelectTrigger id="new-report-project" aria-labelledby="new-report-project-label" className="w-full">
                <SelectValue placeholder="Pilih project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-report-week-start">Week start</Label>
              <Input
                id="new-report-week-start"
                type="date"
                value={weekStartDate}
                onChange={(event) => {
                  setWeekStartDate(event.target.value);
                  resetLookup();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-report-week-end">Week end</Label>
              <Input
                id="new-report-week-end"
                type="date"
                value={weekEndDate}
                onChange={(event) => {
                  setWeekEndDate(event.target.value);
                  resetLookup();
                }}
              />
            </div>
          </div>

          {checking ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Mengecek report untuk project dan minggu ini...
            </p>
          ) : null}

          {!rangeValid && weekStartDate && weekEndDate ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Week end harus setelah week start.
            </p>
          ) : null}

          {projectId && rangeValid && !checking && !reportConflict && checkedKey === currentLookupKey ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Belum ada report untuk {selectedProjectName} pada {formatReportDate(weekStartDate)} - {formatReportDate(weekEndDate)}.
            </div>
          ) : null}

          {createError && !reportConflict ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {createError}
            </p>
          ) : null}

          {reportConflict ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                  <AlertTriangle className="size-4" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">Report minggu ini sudah ada.</p>
                    <StatusBadge status={reportConflict.report.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedProjectName} untuk {formatReportDate(weekStartDate)} - {formatReportDate(weekEndDate)} dibuat oleh{" "}
                    <span className="font-medium text-foreground">{formatCreator(reportConflict)}</span>
                    {reportConflict.report.createdAt ? ` pada ${formatReportTimestamp(reportConflict.report.createdAt)}` : ""}.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/weekly-reports/${reportConflict.report.id}`}>
                      <FileText className="size-4" />
                      Lihat report
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled={createDisabled} onClick={handleCreate}>
            {creating || isNavigating ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
            {creating || isNavigating ? "Opening..." : "Create report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
