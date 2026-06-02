import type { ActionState } from "@/types";

export type WeeklyReportFormValues = {
  projectId?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  summary?: string;
  productionIncidentCount?: string;
  productionIncidentNotes?: string;
  bugDocumentUrl?: string;
  testCaseTotal?: string;
  testCaseBeTotal?: string;
  testCaseFeTotal?: string;
  automationBeTotal?: string;
  automationFeTotal?: string;
  automationBePassed?: string;
  automationBeFailed?: string;
  automationFePassed?: string;
  automationFeFailed?: string;
  automationPassed?: string;
  automationFailed?: string;
  blocker?: string;
  nextWeekPlan?: string;
  notes?: string;
};

export type WeeklyReportActionState = ActionState & {
  values?: WeeklyReportFormValues;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function weeklyReportDefaultsFromFormData(formData: FormData): WeeklyReportFormValues {
  return {
    projectId: value(formData, "projectId"),
    weekStartDate: value(formData, "weekStartDate"),
    weekEndDate: value(formData, "weekEndDate"),
    summary: value(formData, "summary"),
    productionIncidentCount: value(formData, "productionIncidentCount"),
    productionIncidentNotes: value(formData, "productionIncidentNotes"),
    bugDocumentUrl: value(formData, "bugDocumentUrl"),
    testCaseTotal: value(formData, "testCaseTotal"),
    testCaseBeTotal: value(formData, "testCaseBeTotal"),
    testCaseFeTotal: value(formData, "testCaseFeTotal"),
    automationBeTotal: value(formData, "automationBeTotal"),
    automationFeTotal: value(formData, "automationFeTotal"),
    automationBePassed: value(formData, "automationBePassed"),
    automationBeFailed: value(formData, "automationBeFailed"),
    automationFePassed: value(formData, "automationFePassed"),
    automationFeFailed: value(formData, "automationFeFailed"),
    automationPassed: value(formData, "automationPassed"),
    automationFailed: value(formData, "automationFailed"),
    blocker: value(formData, "blocker"),
    nextWeekPlan: value(formData, "nextWeekPlan"),
    notes: value(formData, "notes"),
  };
}

export function weeklyReportErrorState(error: string, formData: FormData): WeeklyReportActionState {
  return { error, values: weeklyReportDefaultsFromFormData(formData) };
}
