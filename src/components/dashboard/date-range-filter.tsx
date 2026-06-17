"use client";

import * as React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { type DateRange, DayPicker } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDashboardDatePresets, type DashboardDatePreset } from "@/lib/dashboard/date-presets";
import { formatReportDate } from "@/lib/reports/format";

type DateRangeFilterProps = {
  from: string;
  to: string;
  defaultFrom: string;
  defaultTo: string;
};

export function DateRangeFilter({ from, to, defaultTo }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [hoveredDate, setHoveredDate] = React.useState<Date>();
  const [isPending, startTransition] = React.useTransition();
  const [draftRange, setDraftRange] = React.useState<DateRange>(() => toDateRange(from, to));
  const presets = React.useMemo(() => getDashboardDatePresets(defaultTo), [defaultTo]);
  const previewRange = getPreviewRange(draftRange, hoveredDate);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setHoveredDate(undefined);
    if (nextOpen) {
      setDraftRange(toDateRange(from, to));
    }
  }

  function updateUrl(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("from", nextFrom);
    params.set("to", nextTo);

    const query = params.toString();
    setOpen(false);
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function selectRange(nextRange: DateRange | undefined) {
    const nextDraftRange = nextRange ?? { from: undefined };
    setHoveredDate(undefined);
    setDraftRange(nextDraftRange);

    if (!nextDraftRange.from || !nextDraftRange.to) return;

    const nextFrom = formatDateValue(nextDraftRange.from);
    const nextTo = formatDateValue(nextDraftRange.to);

    if (nextFrom !== from || nextTo !== to) {
      updateUrl(nextFrom, nextTo);
    }
  }

  function applyPreset(preset: DashboardDatePreset) {
    setHoveredDate(undefined);
    setDraftRange(toDateRange(preset.from, preset.to));
    updateUrl(preset.from, preset.to);
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <CalendarDays className="size-3.5" />
        Periode report
      </div>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 min-w-72 justify-start gap-3 px-3 font-normal shadow-xs"
            disabled={isPending}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="font-medium tabular-nums">{formatRangeLabel(from, to)}</span>
            <ChevronDown className="ml-auto size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto bg-white p-0">
          <div className="grid grid-cols-[12rem_auto] items-stretch">
            <aside className="max-h-[18.875rem] overflow-y-auto border-r bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pilihan cepat</p>
              <div className="mt-2 space-y-1">
                {presets.quick.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    active={matchesRange(draftRange, preset)}
                    onClick={() => applyPreset(preset)}
                  />
                ))}
              </div>

              <div className="my-3 border-t" />

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Minggu bulan ini</p>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {presets.weeks.length}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {presets.weeks.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    active={matchesRange(draftRange, preset)}
                    onClick={() => applyPreset(preset)}
                  />
                ))}
              </div>
            </aside>

            <DayPicker
              mode="range"
              selected={draftRange}
              onSelect={selectRange}
              defaultMonth={draftRange.from}
              locale={id}
              weekStartsOn={1}
              showOutsideDays
              resetOnSelect
              numberOfMonths={2}
              navLayout="around"
              onDayMouseEnter={(day) => setHoveredDate(day)}
              onDayMouseLeave={() => setHoveredDate(undefined)}
              modifiers={{
                range_preview: previewRange,
                range_preview_start: previewRange?.from,
                range_preview_end: previewRange?.to,
              }}
              modifiersClassNames={{
                range_preview: "dashboard-range-preview",
                range_preview_start: "dashboard-range-preview-start",
                range_preview_end: "dashboard-range-preview-end",
              }}
              className="dashboard-range-calendar"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PresetButton({
  preset,
  active,
  onClick,
}: {
  preset: DashboardDatePreset;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.description}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
        active ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200" : "text-slate-700 hover:bg-white"
      }`}
    >
      <span className="text-sm font-medium">{preset.label}</span>
      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{preset.description}</span>
    </button>
  );
}

function toDateRange(from: string, to: string): DateRange {
  return { from: parseISO(from), to: parseISO(to) };
}

function formatDateValue(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function formatRangeLabel(from: string, to: string) {
  return `${formatReportDate(`${from}T00:00:00.000Z`)} – ${formatReportDate(`${to}T00:00:00.000Z`)}`;
}

function getPreviewRange(range: DateRange, hoveredDate: Date | undefined): DateRange | undefined {
  if (!range.from || range.to || !hoveredDate) return undefined;

  return isBeforeDay(hoveredDate, range.from)
    ? { from: hoveredDate, to: range.from }
    : { from: range.from, to: hoveredDate };
}

function isBeforeDay(left: Date, right: Date) {
  return formatDateValue(left) < formatDateValue(right);
}

function matchesRange(range: DateRange, preset: DashboardDatePreset) {
  return Boolean(
    range.from
      && range.to
      && formatDateValue(range.from) === preset.from
      && formatDateValue(range.to) === preset.to,
  );
}
