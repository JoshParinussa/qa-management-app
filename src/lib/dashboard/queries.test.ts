import { describe, expect, it } from "vitest";
import { parseDashboardDateRange } from "./date-range";
import { listCoverageByProject, listRecentReportsByUser } from "./queries";

describe("listRecentReportsByUser", () => {
  it("scopes reports by co-author and detects missing personal approval", () => {
    const query = listRecentReportsByUser("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('from "report_authors"');
    expect(query.sql).toContain('inner join "weekly_reports"');
    expect(query.sql).toContain('left join "report_qa_approvals"');
    expect(query.sql).toContain('"report_authors"."user_id" = $1');
    expect(query.sql).toContain("PENDING_QA_APPROVAL");
  });

  it("filters coverage using report-week overlap", () => {
    const range = parseDashboardDateRange("2026-06-01", "2026-06-05");
    const query = listCoverageByProject(range).toSQL();
    const params = query.params.map((value) => value instanceof Date ? value.toISOString() : String(value));

    expect(query.sql).toContain('"weekly_reports"."week_start_date" <= $2');
    expect(query.sql).toContain('"weekly_reports"."week_end_date" >= $3');
    expect(params).toContain(range.end.toISOString());
    expect(params).toContain(range.start.toISOString());
  });
});
