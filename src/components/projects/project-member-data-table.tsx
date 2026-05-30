"use client";

import { DataTable } from "@/components/ui/data-table";
import { buildMemberColumns, type MemberRow } from "./project-member-columns";

type Props = {
  members: MemberRow[];
  canManage: boolean;
  removeAction?: (formData: FormData) => void;
};

export function ProjectMemberDataTable({ members, canManage, removeAction }: Props) {
  return (
    <DataTable
      columns={buildMemberColumns({ canManage, removeAction })}
      data={members}
      emptyLabel="Belum ada member ter-assign."
    />
  );
}
