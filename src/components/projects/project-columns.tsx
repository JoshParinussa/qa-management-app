"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export type ProjectRow = {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "ARCHIVED";
};

export const projectColumns: ColumnDef<ProjectRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.code}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "ACTIVE" ? "secondary" : "outline"}>
        {row.original.status === "ACTIVE" ? "Active" : "Archived"}
      </Badge>
    ),
  },
  {
    id: "action",
    header: () => <span className="sr-only">Action</span>,
    cell: ({ row }) => (
      <div className="text-right">
        <Link href={`/projects/${row.original.id}`} className="font-medium text-foreground hover:underline">
          View
        </Link>
      </div>
    ),
  },
];
