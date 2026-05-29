import { describe, expect, it } from "vitest";
import { formatReportStatus } from "./status";

describe("report status formatting", () => {
  it("formats enum values as title case labels", () => {
    expect(formatReportStatus("DRAFT")).toBe("Draft");
    expect(formatReportStatus("SUBMITTED")).toBe("Submitted");
    expect(formatReportStatus("NEED_REVISION")).toBe("Need revision");
    expect(formatReportStatus("APPROVED")).toBe("Approved");
  });
});
