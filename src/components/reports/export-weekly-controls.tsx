"use client";

import { Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";

type ProjectOption = { id: string; name: string };

const ALL_PROJECTS_VALUE = "__all__";

type ExportWeeklyControlsProps = {
  projects: ProjectOption[];
  from: string;
  to: string;
  defaultFrom: string;
  defaultTo: string;
  projectId?: string;
};

export function ExportWeeklyControls({
  projects,
  from,
  to,
  defaultFrom,
  defaultTo,
  projectId,
}: ExportWeeklyControlsProps) {
  const router = useRouter();
  const params = useSearchParams();

  function selectProject(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL_PROJECTS_VALUE) {
      next.delete("projectId");
    } else {
      next.set("projectId", value);
    }
    router.push(`/weekly-reports?${next.toString()}`);
  }

  const exportParams = new URLSearchParams({ from, to });
  if (projectId) exportParams.set("projectId", projectId);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label id="export-project-label">Project</Label>
        <Select value={projectId ?? ALL_PROJECTS_VALUE} onValueChange={selectProject}>
          <SelectTrigger id="export-project" aria-labelledby="export-project-label" className="h-10 w-56 shadow-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value={ALL_PROJECTS_VALUE}>All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DateRangeFilter from={from} to={to} defaultFrom={defaultFrom} defaultTo={defaultTo} />

      <a href={`/api/weekly-reports/export?${exportParams.toString()}`}>
        <Button variant="outline" className="h-10">
          <Download className="size-4" />
          Export Markdown
        </Button>
      </a>
    </div>
  );
}
