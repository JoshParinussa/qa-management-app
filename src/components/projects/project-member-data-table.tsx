"use client";

import { DataTable } from "@/components/ui/data-table";
import { buildMemberColumns, type MemberRow } from "./project-member-columns";

type Props = {
  members: MemberRow[];
  canManage: boolean;
  removeAction?: (formData: FormData) => void;
  updateRoleAction?: (formData: FormData) => void;
};

export function ProjectMemberDataTable({ members, canManage, removeAction, updateRoleAction }: Props) {
  return (
    <DataTable
      columns={buildMemberColumns({ canManage, removeAction, updateRoleAction })}
      data={members}
      emptyLabel="Belum ada member ter-assign."
    />
  );
}
