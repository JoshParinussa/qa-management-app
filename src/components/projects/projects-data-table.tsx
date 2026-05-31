"use client";

import { DataTable } from "@/components/ui/data-table";
import { projectColumns, type ProjectRow } from "./project-columns";

export function ProjectsDataTable({ projects }: { projects: ProjectRow[] }) {
  return (
    <DataTable
      columns={projectColumns}
      data={projects}
      emptyLabel="Belum ada project. Buat project pertama."
      searchPlaceholder="Search name or code..."
    />
  );
}
