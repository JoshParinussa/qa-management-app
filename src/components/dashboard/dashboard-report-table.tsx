"use client";

import { CheckCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { weeklyReportColumns, type WeeklyReportRow } from "@/components/reports/weekly-report-columns";

type DashboardReportTableProps = {
  reports: WeeklyReportRow[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DashboardReportTable({
  reports,
  emptyTitle = "All caught up!",
  emptyDescription = "No reports pending review at the moment.",
}: DashboardReportTableProps) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="size-8 text-slate-600" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <DataTable columns={weeklyReportColumns} data={reports} emptyLabel="No reports found" pageSize={5} searchable={false} />;
}
