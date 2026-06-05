import type { z } from "zod";
import type { ActionState } from "@/types";

export type WeeklyReportFieldErrors = Record<string, string>;

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
  fieldErrors?: WeeklyReportFieldErrors;
};

const fieldErrorMessages: Record<string, string> = {
  projectId: "Pilih project yang akan direport.",
  weekStartDate: "Tanggal mulai minggu wajib diisi.",
  weekEndDate: "Tanggal akhir minggu harus setelah tanggal mulai.",
  summary: "Summary wajib diisi minimal satu poin.",
  bugDocumentUrl: "Bug document URL wajib diisi dengan link yang valid.",
  nextWeekPlan: "Next week plan wajib diisi minimal satu poin.",
  productionIncidentNotes: "Lengkapi detail tiap incident: title, description, dan related test case ID.",
  testCaseBeTotal: "Test case BE total wajib diisi (boleh 0).",
  testCaseFeTotal: "Test case FE total wajib diisi (boleh 0).",
  testCaseTotal: "Total test case wajib diisi, dan tidak boleh melebihi BE + FE.",
  testCaseBeExecuted: "BE executed tidak boleh melebihi BE total.",
  testCaseFeExecuted: "FE executed tidak boleh melebihi FE total.",
  automationBeTotal: "BE automation total tidak boleh melebihi BE total test case.",
  automationFeTotal: "FE automation total tidak boleh melebihi FE total test case.",
  automationBePassed: "BE passed dan failed tidak boleh melebihi BE automation total.",
  automationFePassed: "FE passed dan failed tidak boleh melebihi FE automation total.",
  automationPassed: "Automation passed dan failed tidak boleh melebihi automation total.",
};

const incidentFieldErrorMessage = "Lengkapi title, description, dan related test case ID untuk incident ini.";

export function fieldErrorsFromZod(error: z.ZodError): WeeklyReportFieldErrors {
  const result: WeeklyReportFieldErrors = {};

  for (const issue of error.issues) {
    const [first, second] = issue.path;
    if (first === undefined) continue;

    const key = typeof second === "number" ? `${String(first)}.${second}` : String(first);
    if (result[key]) continue;

    if (typeof first === "string" && first === "productionIncidentNotes" && typeof second === "number") {
      result[key] = incidentFieldErrorMessage;
      continue;
    }

    result[key] = fieldErrorMessages[String(first)] ?? issue.message;
  }

  return result;
}

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

export function weeklyReportErrorState(
  error: string,
  formData: FormData,
  fieldErrors?: WeeklyReportFieldErrors,
): WeeklyReportActionState {
  return {
    error,
    values: weeklyReportDefaultsFromFormData(formData),
    ...(fieldErrors && Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
  };
}
