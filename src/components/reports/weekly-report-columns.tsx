"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReportStatus } from "@/types";

export type WeeklyReportRow = {
  id: string;
  projectName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  status: ReportStatus;
};

function formatDate(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export const weeklyReportColumns: ColumnDef<WeeklyReportRow>[] = [
  {
    accessorKey: "projectName",
    header: "Project",
    cell: ({ row }) => <span className="font-medium">{row.original.projectName}</span>,
  },
  {
    id: "week",
    header: "Week",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.weekStartDate)} → {formatDate(row.original.weekEndDate)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "action",
    header: () => <span className="sr-only">Action</span>,
    cell: ({ row }) => (
      <div className="text-right">
        <Link href={`/weekly-reports/${row.original.id}`} className="font-medium text-foreground hover:underline">
          View
        </Link>
      </div>
    ),
  },
];
