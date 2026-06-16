"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPaginationRange } from "@/lib/ui/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

export type CoverageProject = {
  projectId: string;
  projectName: string;
  avgAutomationBe: string | null;
  avgAutomationFe: string | null;
  avgAutomationBePassRate: string | null;
  avgAutomationFePassRate: string | null;
  reportCount: number;
};

export function CoverageProjectList({ projects }: { projects: CoverageProject[] }) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const filteredProjects = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    if (!query) return projects;

    return projects.filter((project) => project.projectName.toLocaleLowerCase("id-ID").includes(query));
  }, [projects, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleProjects = filteredProjects.slice(startIndex, startIndex + PAGE_SIZE);
  const pages = getPaginationRange(safePage, totalPages);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Cari project..."
            aria-label="Cari coverage project"
            className="pl-9 shadow-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredProjects.length === 0
            ? "Tidak ada project"
            : `${startIndex + 1}-${Math.min(startIndex + PAGE_SIZE, filteredProjects.length)} dari ${filteredProjects.length} project`}
        </p>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium">Project tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">Coba gunakan nama project yang berbeda.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[24%] px-6">Project</TableHead>
                  <TableHead className="w-[32%]">Backend</TableHead>
                  <TableHead className="w-[32%]">Frontend</TableHead>
                  <TableHead className="px-6 text-right">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProjects.map((project) => (
                  <TableRow key={project.projectId}>
                    <TableCell className="px-6 py-4 font-medium">{project.projectName}</TableCell>
                    <TableCell className="py-4">
                      <CoverageValue
                        coverage={project.avgAutomationBe}
                        passRate={project.avgAutomationBePassRate}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <CoverageValue
                        coverage={project.avgAutomationFe}
                        passRate={project.avgAutomationFePassRate}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-muted-foreground tabular-nums">
                      {project.reportCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {visibleProjects.map((project) => (
              <section key={project.projectId} className="space-y-4 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium">{project.projectName}</h4>
                  <span className="text-xs text-muted-foreground">{project.reportCount} report</span>
                </div>
                <div className="space-y-4">
                  <CoverageValue
                    label="Backend"
                    coverage={project.avgAutomationBe}
                    passRate={project.avgAutomationBePassRate}
                  />
                  <CoverageValue
                    label="Frontend"
                    coverage={project.avgAutomationFe}
                    passRate={project.avgAutomationFePassRate}
                  />
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {filteredProjects.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {safePage} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Halaman sebelumnya"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {pages.map((pageItem, index) =>
              pageItem === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={pageItem}
                  type="button"
                  variant={pageItem === safePage ? "default" : "outline"}
                  size="icon-sm"
                  aria-label={`Halaman ${pageItem}`}
                  aria-current={pageItem === safePage ? "page" : undefined}
                  className={cn("tabular-nums")}
                  onClick={() => setPage(pageItem)}
                >
                  {pageItem}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Halaman berikutnya"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CoverageValue({
  label,
  coverage,
  passRate,
}: {
  label?: string;
  coverage: string | null;
  passRate: string | null;
}) {
  const coverageValue = Number(coverage) || 0;

  return (
    <div className="min-w-44 space-y-2">
      <div className="flex items-center justify-between gap-3">
        {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : <span />}
        <span className="font-semibold tabular-nums">{formatPercent(coverage)}</span>
      </div>
      <ProgressBar value={coverageValue} />
      <p className="text-xs text-muted-foreground">
        Pass rate <span className="font-medium text-foreground tabular-nums">{formatPercent(passRate)}</span>
      </p>
    </div>
  );
}

function formatPercent(value: string | null) {
  if (!value) return "0%";
  return `${Number(value).toFixed(2)}%`;
}
