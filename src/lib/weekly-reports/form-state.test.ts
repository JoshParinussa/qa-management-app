import { describe, expect, it } from "vitest";
import { fieldErrorsFromZod, weeklyReportDefaultsFromFormData, weeklyReportErrorState } from "./form-state";
import { weeklyReportSchema } from "@/lib/validations/weekly-report";

function parseInvalid(overrides: Record<string, unknown>) {
  const base = {
    projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
    weekStartDate: "2026-06-01",
    weekEndDate: "2026-06-07",
    summary: "Done some work",
    productionIncidentCount: 0,
    bugDocumentUrl: "https://example.test/bugs/weekly",
    testCaseTotal: 0,
    testCaseBeTotal: 0,
    testCaseFeTotal: 0,
    automationBeTotal: 0,
    automationFeTotal: 0,
    nextWeekPlan: "Continue work",
  };
  const result = weeklyReportSchema.safeParse({ ...base, ...overrides });
  if (result.success) throw new Error("expected schema to fail");
  return result.error;
}

describe("weekly report form state", () => {
  it("keeps submitted project and dates for validation errors", () => {
    const formData = new FormData();
    formData.set("projectId", "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293");
    formData.set("weekStartDate", "2026-06-01");
    formData.set("weekEndDate", "2026-06-07");
    formData.set("summary", "[{\"text\":\"Backend\"}]");
    formData.set("productionIncidentCount", "2");
    formData.set("productionIncidentNotes", "[]");
    formData.set("testCaseTotal", "42");
    formData.set("testCaseBeTotal", "");
    formData.set("automationBePassed", "10");
    formData.set("automationBeFailed", "1");
    formData.set("automationFePassed", "20");
    formData.set("automationFeFailed", "2");

    expect(weeklyReportDefaultsFromFormData(formData)).toMatchObject({
      projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      weekStartDate: "2026-06-01",
      weekEndDate: "2026-06-07",
      summary: "[{\"text\":\"Backend\"}]",
      productionIncidentCount: "2",
      productionIncidentNotes: "[]",
      testCaseTotal: "42",
      testCaseBeTotal: "",
      automationBePassed: "10",
      automationBeFailed: "1",
      automationFePassed: "20",
      automationFeFailed: "2",
    });
  });

  it("returns an error state with submitted values", () => {
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("weekStartDate", "2026-06-01");
    formData.set("weekEndDate", "2026-06-07");

    expect(weeklyReportErrorState("Invalid", formData)).toMatchObject({
      error: "Invalid",
      values: {
        projectId: "project-1",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
      },
    });
  });

  it("omits fieldErrors when none are provided", () => {
    const formData = new FormData();
    expect(weeklyReportErrorState("Invalid", formData).fieldErrors).toBeUndefined();
  });

  it("includes fieldErrors when provided", () => {
    const formData = new FormData();
    const state = weeklyReportErrorState("Invalid", formData, { summary: "Wajib diisi." });
    expect(state.fieldErrors).toEqual({ summary: "Wajib diisi." });
  });
});

describe("fieldErrorsFromZod", () => {
  it("maps an invalid project id to a friendly message", () => {
    const errors = fieldErrorsFromZod(parseInvalid({ projectId: "not-a-uuid" }));
    expect(errors.projectId).toBe("Pilih project yang akan direport.");
  });

  it("maps an empty summary to a friendly message", () => {
    const errors = fieldErrorsFromZod(parseInvalid({ summary: "" }));
    expect(errors.summary).toBe("Summary wajib diisi minimal satu poin.");
  });

  it("requires a bug document URL even when there are no incidents", () => {
    const errors = fieldErrorsFromZod(parseInvalid({ productionIncidentCount: 0, bugDocumentUrl: "" }));
    expect(errors.bugDocumentUrl).toBe("Bug document URL wajib diisi dengan link yang valid.");
  });

  it("requires BE and FE test case totals but allows zero", () => {
    const errors = fieldErrorsFromZod(parseInvalid({ testCaseBeTotal: undefined, testCaseFeTotal: undefined }));
    expect(errors.testCaseBeTotal).toBe("Test case BE total wajib diisi (boleh 0).");
    expect(errors.testCaseFeTotal).toBe("Test case FE total wajib diisi (boleh 0).");

    const ok = weeklyReportSchema.safeParse({
      projectId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      weekStartDate: "2026-06-01",
      weekEndDate: "2026-06-07",
      summary: "Done some work",
      productionIncidentCount: 0,
      bugDocumentUrl: "https://example.test/bugs/weekly",
      testCaseTotal: 0,
      testCaseBeTotal: 0,
      testCaseFeTotal: 0,
      automationBeTotal: 0,
      automationFeTotal: 0,
      nextWeekPlan: "Continue work",
    });
    expect(ok.success).toBe(true);
  });

  it("flags the week end date when the range is inverted", () => {
    const errors = fieldErrorsFromZod(parseInvalid({ weekEndDate: "2026-05-01" }));
    expect(errors.weekEndDate).toBe("Tanggal akhir minggu harus setelah tanggal mulai.");
  });

  it("flags missing incident detail with an indexed key", () => {
    const incidents = JSON.stringify([{ title: "x", description: "", relatedTestCaseId: "" }]);
    const errors = fieldErrorsFromZod(
      parseInvalid({ productionIncidentCount: 1, productionIncidentNotes: incidents }),
    );
    expect(errors["productionIncidentNotes.0"]).toBe(
      "Lengkapi title, description, dan related test case ID untuk incident ini.",
    );
  });

  it("flags missing incident notes when count exceeds provided incidents", () => {
    const errors = fieldErrorsFromZod(
      parseInvalid({ productionIncidentCount: 2, productionIncidentNotes: "[]" }),
    );
    expect(errors.productionIncidentNotes).toBe(
      "Lengkapi detail tiap incident: title, description, dan related test case ID.",
    );
  });
});
