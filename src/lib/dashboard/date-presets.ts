import {
  addDays,
  addWeeks,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";

export type DashboardDatePreset = {
  id: string;
  label: string;
  description: string;
  from: string;
  to: string;
};

export function getDashboardDatePresets(todayValue: string) {
  const today = parseISO(todayValue);
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  return {
    quick: [
      createPreset("this-week", "Minggu ini", thisWeekStart, addDays(thisWeekStart, 4)),
      createPreset("last-week", "1 minggu lalu", lastWeekStart, addDays(lastWeekStart, 4)),
      createPreset("this-month", "Bulan ini", startOfMonth(today), today),
    ],
    weeks: getWorkWeeksInMonth(today),
  };
}

export function getWorkWeeksInMonth(date: Date): DashboardDatePreset[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const weeks: DashboardDatePreset[] = [];
  let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });

  while (cursor <= monthEnd) {
    const workWeekEnd = addDays(cursor, 4);

    if (workWeekEnd >= monthStart) {
      const weekNumber = weeks.length + 1;
      weeks.push(createPreset(`month-week-${weekNumber}`, `Week ${weekNumber}`, cursor, workWeekEnd));
    }

    cursor = addWeeks(cursor, 1);
  }

  return weeks;
}

function createPreset(id: string, label: string, from: Date, to: Date): DashboardDatePreset {
  return {
    id,
    label,
    description: formatPresetRange(from, to),
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

function formatPresetRange(from: Date, to: Date) {
  const formatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}
