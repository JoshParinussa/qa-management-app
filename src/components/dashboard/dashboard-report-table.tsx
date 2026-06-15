"use client";

import { CheckCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { weeklyReportColumns, type WeeklyReportRow } from "@/components/reports/weekly-report-columns";

export function DashboardReportTable({ reports }: { reports: WeeklyReportRow[] }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="size-8 text-green-600" />}
        title="All caught up!"
        description="No reports pending review at the moment."
      />
    );
  }

  return <DataTable columns={weeklyReportColumns} data={reports} emptyLabel="No reports found" pageSize={5} searchable={false} />;
}
