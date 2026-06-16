import { describe, expect, it } from "vitest";
import { defaultDashboardDateValues, parseDashboardDateRange } from "./date-range";

describe("dashboard date range", () => {
  it("defaults to the current Jakarta month through today", () => {
    expect(defaultDashboardDateValues(new Date("2026-06-15T01:00:00.000Z"))).toEqual({
      from: "2026-06-01",
      to: "2026-06-15",
    });
  });

  it("normalizes reversed ranges and includes the complete end date", () => {
    const range = parseDashboardDateRange("2026-06-12", "2026-06-08");

    expect(range.from).toBe("2026-06-08");
    expect(range.to).toBe("2026-06-12");
    expect(range.start.toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-06-12T23:59:59.999Z");
  });

  it("falls back when query values are invalid", () => {
    const range = parseDashboardDateRange("invalid", "2026-02-31", new Date("2026-06-15T01:00:00.000Z"));

    expect(range.from).toBe("2026-06-01");
    expect(range.to).toBe("2026-06-15");
  });
});
