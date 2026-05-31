"use client";

import { DataTable } from "@/components/ui/data-table";
import { weeklyReportColumns, type WeeklyReportRow } from "@/components/reports/weekly-report-columns";

export function DashboardReportTable({ reports, emptyLabel }: { reports: WeeklyReportRow[]; emptyLabel: string }) {
  return <DataTable columns={weeklyReportColumns} data={reports} emptyLabel={emptyLabel} pageSize={5} searchable={false} />;
}
