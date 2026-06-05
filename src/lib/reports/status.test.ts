import { describe, expect, it } from "vitest";
import { formatReportStatus, reportStageDescription } from "./status";

describe("report status formatting", () => {
  it("formats enum values as title case labels", () => {
    expect(formatReportStatus("DRAFT")).toBe("Draft");
    expect(formatReportStatus("PENDING_QA_APPROVAL")).toBe("Pending qa approval");
    expect(formatReportStatus("SUBMITTED")).toBe("Submitted");
    expect(formatReportStatus("NEED_REVISION")).toBe("Need revision");
    expect(formatReportStatus("APPROVED")).toBe("Approved");
  });
});

describe("reportStageDescription", () => {
  it("explains the draft stage", () => {
    expect(reportStageDescription("DRAFT")).toBe("Belum diajukan untuk approval QA");
  });

  it("explains that submitted reports await the QA Lead", () => {
    expect(reportStageDescription("SUBMITTED")).toBe("Menunggu review & approval dari QA Lead");
  });

  it("names the submitter when provided for submitted reports", () => {
    expect(reportStageDescription("SUBMITTED", { submitterName: "Andi" })).toBe(
      "Dikirim ke reviewer oleh Andi",
    );
  });

  it("describes the PENDING_QA_APPROVAL stage with progress when provided", () => {
    expect(
      reportStageDescription("PENDING_QA_APPROVAL", { approvalProgress: { approved: 1, total: 3 } }),
    ).toBe("Menunggu approval QA (1/3)");
  });

  it("describes the PENDING_QA_APPROVAL stage generically without progress", () => {
    expect(reportStageDescription("PENDING_QA_APPROVAL")).toBe("Menunggu approval internal QA");
  });

  it("explains that a revision is needed", () => {
    expect(reportStageDescription("NEED_REVISION")).toBe(
      "Perlu diperbaiki, lalu ajukan approval QA ulang",
    );
  });

  it("names the reviewer when reviewed", () => {
    expect(reportStageDescription("REVIEWED", { reviewerName: "Budi" })).toBe("Sudah direview oleh Budi");
  });

  it("falls back to a generic reviewer label when the name is missing", () => {
    expect(reportStageDescription("REVIEWED")).toBe("Sudah direview oleh QA Lead");
  });

  it("names the approver when approved", () => {
    expect(reportStageDescription("APPROVED", { approverName: "Sinta" })).toBe("Disetujui oleh Sinta");
  });

  it("falls back to a generic approver label when the name is missing", () => {
    expect(reportStageDescription("APPROVED")).toBe("Disetujui oleh QA Lead");
  });
});
