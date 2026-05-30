"use client";

import { DataTable } from "@/components/ui/data-table";
import { weeklyReportColumns, type WeeklyReportRow } from "./weekly-report-columns";

export function WeeklyReportsDataTable({ reports }: { reports: WeeklyReportRow[] }) {
  return <DataTable columns={weeklyReportColumns} data={reports} emptyLabel="Belum ada report." />;
}
