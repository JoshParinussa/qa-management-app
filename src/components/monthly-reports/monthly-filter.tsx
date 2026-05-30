"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";

type ProjectOption = { id: string; name: string };

export function MonthlyFilter({ projects, month, projectId }: { projects: ProjectOption[]; month: string; projectId?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`/monthly-reports?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="month">Month</Label>
        <input
          id="month"
          type="month"
          defaultValue={month}
          onChange={(e) => update("month", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <select
          id="projectId"
          defaultValue={projectId ?? ""}
          onChange={(e) => update("projectId", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
