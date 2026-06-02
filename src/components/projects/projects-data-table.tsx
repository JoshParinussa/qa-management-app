"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { buildProjectColumns, type ProjectRow } from "./project-columns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = {
  projects: ProjectRow[];
  canManage: boolean;
  archiveAction?: (formData: FormData) => void | Promise<void>;
  restoreAction?: (formData: FormData) => void | Promise<void>;
};

export function ProjectsDataTable({ projects, canManage, archiveAction, restoreAction }: Props) {
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return projects.filter((project) => status === "ALL" || project.status === status);
  }, [projects, status]);

  return (
    <DataTable
      columns={buildProjectColumns({ canManage, archiveAction, restoreAction })}
      data={filtered}
      emptyLabel="Belum ada project. Buat project pertama."
      searchPlaceholder="Search name or code..."
      toolbar={(
        <div className="space-y-2">
          <Label htmlFor="filterProjectStatus">Filter status</Label>
          <select id="filterProjectStatus" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}
    />
  );
}
