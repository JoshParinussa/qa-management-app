"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectOption = { id: string; name: string };

const ALL_PROJECTS_VALUE = "__all__";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyFilter({ projects, month, projectId }: { projects: ProjectOption[]; month: string; projectId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [monthOpen, setMonthOpen] = React.useState(false);
  const [visibleYear, setVisibleYear] = React.useState(() => Number(month.slice(0, 4)));
  const selectedMonthIndex = Number(month.slice(5, 7)) - 1;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`/monthly-reports?${next.toString()}`);
  }

  function handleMonthOpenChange(nextOpen: boolean) {
    setMonthOpen(nextOpen);
    if (nextOpen) {
      setVisibleYear(Number(month.slice(0, 4)));
    }
  }

  function selectMonth(monthIndex: number) {
    update("month", `${visibleYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setMonthOpen(false);
  }

  function selectThisMonth() {
    update("month", formatMonthValue(new Date()));
    setVisibleYear(new Date().getFullYear());
    setMonthOpen(false);
  }

  function clearMonth() {
    update("month", "");
    setMonthOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label id="month-label">Month</Label>
        <Popover open={monthOpen} onOpenChange={handleMonthOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id="month"
              type="button"
              variant="outline"
              aria-labelledby="month-label month-value"
              className="h-9 w-44 justify-between px-3 font-normal shadow-xs"
            >
              <span id="month-value" className="tabular-nums">{formatMonthLabel(month)}</span>
              <CalendarDays className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 overflow-hidden bg-white p-0">
            <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Previous year"
                onClick={() => setVisibleYear((year) => year - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <p className="text-sm font-semibold tabular-nums">{visibleYear}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Next year"
                onClick={() => setVisibleYear((year) => year + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {MONTH_LABELS.map((label, index) => {
                const active = visibleYear === Number(month.slice(0, 4)) && index === selectedMonthIndex;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectMonth(index)}
                    className={`h-9 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-slate-700 hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t px-3 py-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearMonth}>
                Clear
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={selectThisMonth}>
                This month
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label id="monthly-project-label">Project</Label>
        <Select
          value={projectId ?? ALL_PROJECTS_VALUE}
          onValueChange={(value) => update("projectId", value === ALL_PROJECTS_VALUE ? "" : value)}
        >
          <SelectTrigger id="monthly-project" aria-labelledby="monthly-project-label" className="h-9 w-56 shadow-xs">
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
    </div>
  );
}

function formatMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "Select month";

  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1));
}
