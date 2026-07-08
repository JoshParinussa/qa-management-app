import { describe, expect, it } from "vitest";
import {
  getReportByIdQuery,
  listPendingReportIdsByAuthor,
  listReportAuthors,
  listReportsByCoAuthor,
  listReportsForExportByIds,
} from "./queries";

describe("getReportByIdQuery", () => {
  it("loads the related project identity for detail pages", () => {
    const query = getReportByIdQuery("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('inner join "projects"');
    expect(query.sql).toContain('"projects"."name"');
    expect(query.sql).toContain('"projects"."code"');
  });
});

describe("listReportsByCoAuthor", () => {
  it("joins report authors instead of using a single-row subquery", () => {
    const query = listReportsByCoAuthor("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('inner join "report_authors"');
    expect(query.sql).toContain('"report_authors"."weekly_report_id" = "weekly_reports"."id"');
    expect(query.sql).toContain('"report_authors"."user_id" = $1');
    expect(query.sql).not.toContain('= (select "weekly_report_id" from "report_authors"');
  });
});

describe("approval requirement queries", () => {
  it("loads user activity status with each report author", () => {
    const query = listReportAuthors("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('"users"."is_active"');
    expect(query.sql).toContain('inner join "users"');
  });

  it("finds pending reports affected by a deactivated author", () => {
    const query = listPendingReportIdsByAuthor("018f0b3c-1d2e-7a3b-8c4d-5e6f70819294").toSQL();

    expect(query.sql).toContain('inner join "weekly_reports"');
    expect(query.sql).toContain('"weekly_reports"."status" = $2');
    expect(query.params).toContain("PENDING_QA_APPROVAL");
  });
});

describe("listReportsForExportByIds", () => {
  it("filters by the provided report ids", () => {
    const ids = [
      "018f0b3c-1d2e-7a3b-8c4d-5e6f70819294",
      "018f0b3c-1d2e-7a3b-8c4d-5e6f70819295",
    ];
    const query = listReportsForExportByIds(ids).toSQL();

    expect(query.sql).toContain('"weekly_reports"."id" in');
    expect(query.params).toEqual(expect.arrayContaining(ids));
  });

  it("orders by project name then week start date", () => {
    const query = listReportsForExportByIds(["018f0b3c-1d2e-7a3b-8c4d-5e6f70819294"]).toSQL();

    expect(query.sql).toContain('order by "projects"."name", "weekly_reports"."week_start_date"');
  });
});
