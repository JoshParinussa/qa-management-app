"use client";

import { DataTable } from "@/components/ui/data-table";
import { userColumns, type UserRow } from "./user-columns";

export function UsersDataTable({ users }: { users: UserRow[] }) {
  return <DataTable columns={userColumns} data={users} emptyLabel="Belum ada user." />;
}
