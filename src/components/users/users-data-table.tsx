"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { userColumns, type UserRow } from "./user-columns";
import { getRoleLabel } from "@/lib/users/profile";
import { roles } from "@/types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function UsersDataTable({ users }: { users: UserRow[] }) {
  const [role, setRole] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (role !== "ALL" && user.role !== role) return false;
      if (status === "ACTIVE" && !user.isActive) return false;
      if (status === "INACTIVE" && user.isActive) return false;
      return true;
    });
  }, [users, role, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="filterRole">Filter role</Label>
          <select id="filterRole" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            <option value="ALL">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filterStatus">Filter status</Label>
          <select id="filterStatus" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
      <DataTable
        columns={userColumns}
        data={filtered}
        emptyLabel="Tidak ada user yang cocok."
        searchPlaceholder="Search name or email..."
      />
    </div>
  );
}
