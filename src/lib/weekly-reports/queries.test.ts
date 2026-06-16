import { describe, expect, it } from "vitest";
import { listReportsByCoAuthor } from "./queries";

describe("listReportsByCoAuthor", () => {
  it("joins report authors instead of using a single-row subquery", () => {
    const query = listReportsByCoAuthor("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('inner join "report_authors"');
    expect(query.sql).toContain('"report_authors"."weekly_report_id" = "weekly_reports"."id"');
    expect(query.sql).toContain('"report_authors"."user_id" = $1');
    expect(query.sql).not.toContain('= (select "weekly_report_id" from "report_authors"');
  });
});
