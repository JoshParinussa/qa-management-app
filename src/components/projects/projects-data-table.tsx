"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { buildProjectColumns, type ProjectRow } from "./project-columns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const STORAGE_KEY = "qa-management:projects-table-state";

type Props = {
  projects: ProjectRow[];
  canManage: boolean;
  archiveAction?: (formData: FormData) => void | Promise<void>;
  restoreAction?: (formData: FormData) => void | Promise<void>;
};

function parsePageSize(value: unknown) {
  const pageSize = Number(value ?? 10);
  return [10, 20, 50].includes(pageSize) ? pageSize : 10;
}

function parseStatus(value: unknown) {
  return value === "ACTIVE" || value === "ARCHIVED" ? value : "ALL";
}

function readStoredState() {
  if (typeof window === "undefined") {
    return { status: "ALL", search: "", pagination: { pageIndex: 0, pageSize: 10 } };
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "ALL", search: "", pagination: { pageIndex: 0, pageSize: 10 } };

    const parsed = JSON.parse(raw) as {
      status?: unknown;
      search?: unknown;
      pageIndex?: unknown;
      pageSize?: unknown;
    };
    const pageIndex = Number(parsed.pageIndex ?? 0);

    return {
      status: parseStatus(parsed.status),
      search: typeof parsed.search === "string" ? parsed.search : "",
      pagination: {
        pageIndex: Number.isFinite(pageIndex) && pageIndex >= 0 ? Math.floor(pageIndex) : 0,
        pageSize: parsePageSize(parsed.pageSize),
      },
    };
  } catch {
    return { status: "ALL", search: "", pagination: { pageIndex: 0, pageSize: 10 } };
  }
}

export function ProjectsDataTable({ projects, canManage, archiveAction, restoreAction }: Props) {
  const initialState = useMemo(() => readStoredState(), []);
  const [status, setStatus] = useState<string>(initialState.status);
  const [search, setSearch] = useState(initialState.search);
  const [pagination, setPagination] = useState<PaginationState>(initialState.pagination);

  const filtered = useMemo(() => {
    return projects.filter((project) => status === "ALL" || project.status === status);
  }, [projects, status]);

  useEffect(() => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        status,
        search,
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }),
    );
  }, [pagination.pageIndex, pagination.pageSize, search, status]);

  const handleGlobalFilterChange = useCallback((nextSearch: string) => {
    setSearch(nextSearch);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, []);

  const handlePaginationChange = useCallback((nextPagination: PaginationState) => {
    setPagination(nextPagination);
  }, []);

  return (
    <DataTable
      columns={buildProjectColumns({
        canManage,
        archiveAction,
        restoreAction,
      })}
      data={filtered}
      emptyLabel="Belum ada project. Buat project pertama."
      searchPlaceholder="Search name or code..."
      initialGlobalFilter={initialState.search}
      initialPageIndex={initialState.pagination.pageIndex}
      pageSize={initialState.pagination.pageSize}
      globalFilterValue={search}
      paginationValue={pagination}
      resetPageKey={status}
      onGlobalFilterChange={handleGlobalFilterChange}
      onPaginationChange={handlePaginationChange}
      toolbar={(
        <div className="space-y-2">
          <Label htmlFor="filterProjectStatus">Filter status</Label>
          <select
            id="filterProjectStatus"
            value={status}
            onChange={(e) => {
              const nextStatus = e.target.value;
              setStatus(nextStatus);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
            className={selectClass}
          >
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}
    />
  );
}
