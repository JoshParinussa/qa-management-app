import { describe, expect, it } from "vitest";
import { getDashboardDatePresets, getWorkWeeksInMonth } from "./date-presets";

describe("dashboard date presets", () => {
  it("creates quick presets using Monday to Friday work weeks", () => {
    const presets = getDashboardDatePresets("2026-06-15");

    expect(presets.quick.map(({ id, from, to }) => ({ id, from, to }))).toEqual([
      { id: "this-week", from: "2026-06-15", to: "2026-06-19" },
      { id: "last-week", from: "2026-06-08", to: "2026-06-12" },
      { id: "this-month", from: "2026-06-01", to: "2026-06-15" },
    ]);
  });

  it("lists every work week that intersects the current month", () => {
    const weeks = getWorkWeeksInMonth(new Date(2026, 5, 15));

    expect(weeks.map(({ label, from, to }) => ({ label, from, to }))).toEqual([
      { label: "Week 1", from: "2026-06-01", to: "2026-06-05" },
      { label: "Week 2", from: "2026-06-08", to: "2026-06-12" },
      { label: "Week 3", from: "2026-06-15", to: "2026-06-19" },
      { label: "Week 4", from: "2026-06-22", to: "2026-06-26" },
      { label: "Week 5", from: "2026-06-29", to: "2026-07-03" },
    ]);
  });
});
