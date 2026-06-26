import { describe, expect, it } from "vitest";
import { formatReportDate, formatReportTimestamp } from "./format";

describe("report formatters", () => {
  it("formats event timestamps in Jakarta time", () => {
    expect(formatReportTimestamp("2026-06-26T02:28:00.000Z")).toBe("26 Jun 2026, 09.28 WIB");
  });

  it("keeps report dates stable as UTC calendar days", () => {
    expect(formatReportDate("2026-06-26T00:00:00.000Z")).toBe("26 Jun 2026");
  });
});
