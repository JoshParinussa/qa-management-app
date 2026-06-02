"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

export type ProjectRow = {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "ARCHIVED";
};

type BuildArgs = {
  canManage: boolean;
  archiveAction?: (formData: FormData) => void | Promise<void>;
  restoreAction?: (formData: FormData) => void | Promise<void>;
};

export function buildProjectColumns({ canManage, archiveAction, restoreAction }: BuildArgs): ColumnDef<ProjectRow>[] {
  return [
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
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
  },
    {
      id: "action",
      enableSorting: false,
      header: () => <span className="sr-only">Action</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${row.original.id}`}>View</Link>
          </Button>
          {canManage && row.original.status === "ACTIVE" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/projects/${row.original.id}/edit`}>Edit</Link>
            </Button>
          ) : null}
          {canManage && row.original.status === "ACTIVE" ? (
            <form action={archiveAction}>
              <input type="hidden" name="projectId" value={row.original.id} />
              <Button type="submit" variant="ghost" size="sm">Archive</Button>
            </form>
          ) : null}
          {canManage && row.original.status === "ARCHIVED" ? (
            <form action={restoreAction}>
              <input type="hidden" name="projectId" value={row.original.id} />
              <Button type="submit" variant="ghost" size="sm">Restore</Button>
            </form>
          ) : null}
        </div>
      ),
    },
  ];
}
