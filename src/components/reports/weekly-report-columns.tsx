"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReportStatus } from "@/types";

export type WeeklyReportRow = {
  id: string;
  projectName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  status: ReportStatus;
  canEdit?: boolean;
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
    enableSorting: false,
    header: () => <span className="sr-only">Action</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/weekly-reports/${row.original.id}`}>View</Link>
        </Button>
        {row.original.canEdit ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/weekly-reports/${row.original.id}/edit`}>Edit</Link>
          </Button>
        ) : null}
      </div>
    ),
  },
];
