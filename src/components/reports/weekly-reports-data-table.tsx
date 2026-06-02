"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { formatReportStatus } from "@/lib/reports/status";
import { reportStatuses } from "@/types";
import { weeklyReportColumns, type WeeklyReportRow } from "./weekly-report-columns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function WeeklyReportsDataTable({ reports }: { reports: WeeklyReportRow[] }) {
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return reports.filter((report) => status === "ALL" || report.status === status);
  }, [reports, status]);

  return (
    <DataTable
      columns={weeklyReportColumns}
      data={filtered}
      emptyLabel="Belum ada report."
      searchPlaceholder="Search project..."
      toolbar={(
        <div className="space-y-2">
          <Label htmlFor="filterReportStatus">Filter status</Label>
          <select id="filterReportStatus" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="ALL">All status</option>
            {reportStatuses.map((reportStatus) => (
              <option key={reportStatus} value={reportStatus}>{formatReportStatus(reportStatus)}</option>
            ))}
          </select>
        </div>
      )}
    />
  );
}
