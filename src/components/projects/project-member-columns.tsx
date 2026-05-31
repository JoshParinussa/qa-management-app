"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  assignmentRole: "QA_MEMBER" | "QA_PIC";
};

type BuildArgs = {
  canManage: boolean;
  removeAction?: (formData: FormData) => void;
  updateRoleAction?: (formData: FormData) => void;
};

export function buildMemberColumns({ canManage, removeAction, updateRoleAction }: BuildArgs): ColumnDef<MemberRow>[] {
  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "assignmentRole",
      header: "Role",
      cell: ({ row }) =>
        canManage ? (
          <form action={updateRoleAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={row.original.userId} />
            <select
              name="assignmentRole"
              defaultValue={row.original.assignmentRole}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="QA_MEMBER">QA Member</option>
              <option value="QA_PIC">QA PIC</option>
            </select>
            <Button type="submit" variant="ghost" size="sm">Save</Button>
          </form>
        ) : (
          <Badge variant="secondary">{row.original.assignmentRole === "QA_PIC" ? "QA PIC" : "QA Member"}</Badge>
        ),
    },
  ];

  if (canManage) {
    columns.push({
      id: "action",
      header: () => <span className="sr-only">Action</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <form action={removeAction}>
            <input type="hidden" name="userId" value={row.original.userId} />
            <Button type="submit" variant="ghost" size="sm">Remove</Button>
          </form>
        </div>
      ),
    });
  }

  return columns;
}
