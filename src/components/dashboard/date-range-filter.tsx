"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, RotateCcw } from "lucide-react";
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

export function DateRangeFilter({ from, to, defaultFrom, defaultTo }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [draftRange, setDraftRange] = React.useState<DateRange>(() => toDateRange(from, to));
  const presets = React.useMemo(() => getDashboardDatePresets(defaultTo), [defaultTo]);
  const hasCompleteRange = Boolean(draftRange.from && draftRange.to);
  const hasChanges = draftRange.from && draftRange.to
    ? formatDateValue(draftRange.from) !== from || formatDateValue(draftRange.to) !== to
    : false;
  const isDefaultRange = from === defaultFrom && to === defaultTo;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setDraftRange(toDateRange(from, to));
  }

  function updateUrl(nextFrom: string, nextTo: string, reset = false) {
    const params = new URLSearchParams(searchParams.toString());

    if (reset) {
      params.delete("from");
      params.delete("to");
    } else {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    }

    const query = params.toString();
    setOpen(false);
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function applyDraftRange() {
    if (!draftRange.from || !draftRange.to) return;
    updateUrl(formatDateValue(draftRange.from), formatDateValue(draftRange.to));
  }

  function applyPreset(preset: DashboardDatePreset) {
    setDraftRange(toDateRange(preset.from, preset.to));
    updateUrl(preset.from, preset.to);
  }

  function resetRange() {
    setDraftRange(toDateRange(defaultFrom, defaultTo));
    updateUrl(defaultFrom, defaultTo, true);
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
        <PopoverContent align="end" className="w-[min(94vw,41rem)] overflow-hidden bg-white p-0">
          <div className="grid bg-white md:grid-cols-[13.5rem_1fr]">
            <aside className="border-b bg-slate-50 p-4 md:border-r md:border-b-0">
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

              <div className="my-4 border-t" />

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Minggu bulan ini</p>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {presets.weeks.length} minggu
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 md:grid-cols-1">
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

            <div className="min-w-0 bg-white p-4">
              <div className="flex justify-center">
                <DayPicker
                  mode="range"
                  selected={draftRange}
                  onSelect={(nextRange) => setDraftRange(nextRange ?? { from: undefined })}
                  defaultMonth={draftRange.from}
                  locale={id}
                  weekStartsOn={1}
                  showOutsideDays
                  resetOnSelect
                  navLayout="around"
                  className="dashboard-range-calendar"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Rentang dipilih</p>
              <p className="text-sm font-medium tabular-nums">
                {draftRange.from
                  ? draftRange.to
                    ? formatRangeLabel(formatDateValue(draftRange.from), formatDateValue(draftRange.to))
                    : `${formatReportDate(draftRange.from)} – pilih tanggal akhir`
                  : "Belum ada tanggal dipilih"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              {!isDefaultRange ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetRange} disabled={isPending}>
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                onClick={applyDraftRange}
                disabled={!hasCompleteRange || !hasChanges || isPending}
              >
                Terapkan
              </Button>
            </div>
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
        active ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-200" : "hover:bg-white"
      }`}
    >
      <span className="text-sm font-medium">{preset.label}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">{preset.description}</span>
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

function matchesRange(range: DateRange, preset: DashboardDatePreset) {
  return Boolean(
    range.from
      && range.to
      && formatDateValue(range.from) === preset.from
      && formatDateValue(range.to) === preset.to,
  );
}
