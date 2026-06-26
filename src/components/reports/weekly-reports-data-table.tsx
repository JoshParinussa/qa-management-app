"use client";

import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { formatReportDate } from "@/lib/reports/format";
import { formatReportStatus } from "@/lib/reports/status";
import { reportStatuses } from "@/types";
import { weeklyReportColumns, type WeeklyReportRow } from "./weekly-report-columns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ALL_STATUS = "ALL";

type DateDefaults = { from: string; to: string };

function toDateValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function WeeklyReportsDataTable({
  reports,
  canExport = false,
  dateDefaults,
}: {
  reports: WeeklyReportRow[];
  canExport?: boolean;
  dateDefaults: DateDefaults;
}) {
  const [status, setStatus] = useState<string>(ALL_STATUS);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(dateDefaults.from);
  const [to, setTo] = useState(dateDefaults.to);
  const [filteredRows, setFilteredRows] = useState<WeeklyReportRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);

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

  function handleRangeChange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
  }

  function periodLabel(): string {
    return `${formatReportDate(`${from}T00:00:00.000Z`)} – ${formatReportDate(`${to}T00:00:00.000Z`)}`;
  }

  async function handleExport() {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "weekly-reports.md";

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
      columns={weeklyReportColumns}
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
          {canExport ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={handleExport}
              disabled={isExporting || filteredRows.length === 0}
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : `Export Markdown (${filteredRows.length})`}
            </Button>
          ) : null}
        </div>
      )}
    />
  );
}
