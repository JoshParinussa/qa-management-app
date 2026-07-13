"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ChevronDown, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { formatReportDate } from "@/lib/reports/format";
import { formatReportStatus } from "@/lib/reports/status";
import { reportStatuses } from "@/types";
import type { ExportFormat } from "@/lib/weekly-reports/export-data";
import { weeklyReportColumns, type WeeklyReportRow } from "./weekly-report-columns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ALL_STATUS = "ALL";

type DateDefaults = { from: string; to: string };

function toDateValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

function canBulkApproveReport(report: WeeklyReportRow) {
  return report.status === "SUBMITTED";
}

export function WeeklyReportsDataTable({
  approveReports,
  canBulkApprove = false,
  reports,
  canExport = false,
  dateDefaults,
}: {
  approveReports?: (reportIds: string[]) => Promise<{
    error?: string;
    success?: string;
    approvedCount?: number;
    skippedCount?: number;
  }>;
  canBulkApprove?: boolean;
  reports: WeeklyReportRow[];
  canExport?: boolean;
  dateDefaults: DateDefaults;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(ALL_STATUS);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(dateDefaults.from);
  const [to, setTo] = useState(dateDefaults.to);
  const [filteredRows, setFilteredRows] = useState<WeeklyReportRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [isBulkApproving, startBulkApprove] = useTransition();

  const preFiltered = useMemo(() => {
    return reports.filter((report) => {
      if (status !== ALL_STATUS && report.status !== status) return false;
      // Date range overlap: report week intersects [from, to].
      if (from && toDateValue(report.weekEndDate) < from) return false;
      if (to && toDateValue(report.weekStartDate) > to) return false;
      return true;
    });
  }, [reports, status, from, to]);

  const handleFilteredDataChange = useCallback((rows: WeeklyReportRow[]) => {
    setFilteredRows(rows);
  }, []);

  const selectedApprovalIdSet = useMemo(() => new Set(selectedApprovalIds), [selectedApprovalIds]);
  const approvableFilteredIds = useMemo(
    () => filteredRows.filter((report) => canBulkApproveReport(report)).map((report) => report.id),
    [filteredRows],
  );
  const allFilteredSubmittedSelected =
    approvableFilteredIds.length > 0 && approvableFilteredIds.every((id) => selectedApprovalIdSet.has(id));
  const hasFilteredSubmittedSelected = approvableFilteredIds.some((id) => selectedApprovalIdSet.has(id));

  const toggleApprovalSelection = useCallback((reportId: string, checked: boolean) => {
    setSelectedApprovalIds((current) => {
      if (checked) return current.includes(reportId) ? current : [...current, reportId];
      return current.filter((id) => id !== reportId);
    });
  }, []);

  const toggleFilteredSubmittedSelection = useCallback((checked: boolean) => {
    setSelectedApprovalIds((current) => {
      const next = new Set(current);
      for (const reportId of approvableFilteredIds) {
        if (checked) {
          next.add(reportId);
        } else {
          next.delete(reportId);
        }
      }
      return [...next];
    });
  }, [approvableFilteredIds]);

  function handleBulkApprove() {
    if (!approveReports || selectedApprovalIds.length === 0 || isBulkApproving) return;

    startBulkApprove(() => {
      void (async () => {
        const result = await approveReports(selectedApprovalIds);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success(result.success ?? "Report berhasil di-approve.");
        setSelectedApprovalIds([]);
        router.refresh();
      })();
    });
  }

  const columns = useMemo<ColumnDef<WeeklyReportRow>[]>(() => {
    if (!canBulkApprove) return weeklyReportColumns;

    return [
      {
        id: "bulkApprove",
        enableSorting: false,
        header: () => (
          <Checkbox
            aria-label="Select all submitted reports in current filters"
            checked={allFilteredSubmittedSelected ? true : hasFilteredSubmittedSelected ? "indeterminate" : false}
            disabled={approvableFilteredIds.length === 0 || isBulkApproving}
            onCheckedChange={(checked) => toggleFilteredSubmittedSelection(checked === true)}
          />
        ),
        cell: ({ row }) => {
          const report = row.original;
          const canSelect = canBulkApproveReport(report);

          return (
            <Checkbox
              aria-label={`Select ${report.projectName} for bulk approve`}
              checked={selectedApprovalIdSet.has(report.id)}
              disabled={!canSelect || isBulkApproving}
              onCheckedChange={(checked) => toggleApprovalSelection(report.id, checked === true)}
            />
          );
        },
      },
      ...weeklyReportColumns,
    ];
  }, [
    allFilteredSubmittedSelected,
    approvableFilteredIds,
    canBulkApprove,
    hasFilteredSubmittedSelected,
    isBulkApproving,
    selectedApprovalIdSet,
    toggleApprovalSelection,
    toggleFilteredSubmittedSelection,
  ]);

  function handleRangeChange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
  }

  function periodLabel(): string {
    return `${formatReportDate(`${from}T00:00:00.000Z`)} – ${formatReportDate(`${to}T00:00:00.000Z`)}`;
  }

  async function handleExport(format: ExportFormat) {
    if (filteredRows.length === 0) {
      toast.error("Tidak ada report untuk diexport dengan filter ini.");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch("/api/weekly-reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: filteredRows.map((row) => row.id),
          projectLabel: search.trim() ? `Search: "${search.trim()}"` : "All projects",
          statusLabel: status === ALL_STATUS ? "All status" : formatReportStatus(status as WeeklyReportRow["status"]),
          periodLabel: periodLabel(),
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `weekly-reports.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal export report.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DataTable
      columns={columns}
      data={preFiltered}
      emptyLabel="Belum ada report."
      searchPlaceholder="Search project..."
      globalFilterValue={search}
      onGlobalFilterChange={setSearch}
      onFilteredDataChange={handleFilteredDataChange}
      toolbar={(
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="filterReportStatus">Filter status</Label>
            <select
              id="filterReportStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value={ALL_STATUS}>All status</option>
              {reportStatuses.map((reportStatus) => (
                <option key={reportStatus} value={reportStatus}>{formatReportStatus(reportStatus)}</option>
              ))}
            </select>
          </div>
          <DateRangeFilter
            from={from}
            to={to}
            defaultFrom={dateDefaults.from}
            defaultTo={dateDefaults.to}
            onChange={handleRangeChange}
          />
          {canBulkApprove ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              disabled={selectedApprovalIds.length === 0 || isBulkApproving || !approveReports}
              onClick={handleBulkApprove}
            >
              {isBulkApproving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {isBulkApproving ? "Approving..." : `Approve selected (${selectedApprovalIds.length})`}
            </Button>
          ) : null}
          {canExport ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={isExporting || filteredRows.length === 0}
                >
                  <Download className="size-4" />
                  {isExporting ? "Exporting..." : `Export (${filteredRows.length})`}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleExport("pdf")}>
                  <FileText className="size-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport("docx")}>
                  <FileText className="size-4" />
                  Docs (.docx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}
    />
  );
}
