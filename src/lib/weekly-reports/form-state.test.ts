import { describe, expect, it } from "vitest";
import { weeklyReportDefaultsFromFormData, weeklyReportErrorState } from "./form-state";

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
});
