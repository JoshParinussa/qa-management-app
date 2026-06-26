import { describe, expect, it } from "vitest";
import { listApprovedReportsForExport, listReportsByCoAuthor } from "./queries";

describe("listReportsByCoAuthor", () => {
  it("joins report authors instead of using a single-row subquery", () => {
    const query = listReportsByCoAuthor("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('inner join "report_authors"');
    expect(query.sql).toContain('"report_authors"."weekly_report_id" = "weekly_reports"."id"');
    expect(query.sql).toContain('"report_authors"."user_id" = $1');
    expect(query.sql).not.toContain('= (select "weekly_report_id" from "report_authors"');
  });
});

describe("listApprovedReportsForExport", () => {
  const range = {
    start: new Date("2026-06-01T00:00:00.000Z"),
    end: new Date("2026-06-30T23:59:59.999Z"),
  };

  it("filters by approved status and week overlap", () => {
    const query = listApprovedReportsForExport({ ...range }).toSQL();

    expect(query.sql).toContain('"weekly_reports"."status" = $1');
    expect(query.params).toContain("APPROVED");
    expect(query.sql).toContain('"weekly_reports"."week_start_date" <=');
    expect(query.sql).toContain('"weekly_reports"."week_end_date" >=');
  });

  it("adds a project filter when projectId is provided", () => {
    const query = listApprovedReportsForExport({
      ...range,
      projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294",
    }).toSQL();

    expect(query.sql).toContain('"weekly_reports"."project_id" = $');
    expect(query.params).toContain("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294");
  });

  it("omits the project filter when projectId is absent", () => {
    const query = listApprovedReportsForExport({ ...range }).toSQL();

    // Only status + range params (no extra project_id equality param).
    expect(query.params).toHaveLength(3);
  });
});
