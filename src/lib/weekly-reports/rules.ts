import type { ReportStatus } from "@/types";

export function canEditReport(status: ReportStatus): boolean {
  return status === "DRAFT" || status === "PENDING_QA_APPROVAL" || status === "NEED_REVISION";
}

type ReadinessInput = { summary: string; nextWeekPlan: string };
type Readiness = { ok: true } | { ok: false; error: string };

export function validateSubmitReadiness(input: ReadinessInput): Readiness {
  if (!input.summary.trim()) {
    return { ok: false, error: "Summary wajib diisi sebelum submit." };
  }

  if (!input.nextWeekPlan.trim()) {
    return { ok: false, error: "Next week plan wajib diisi sebelum submit." };
  }

  return { ok: true };
}

export const CONTENT_FIELDS = [
  "summary",
  "nextWeekPlan",
  "blocker",
  "notes",
  "productionIncidentCount",
  "productionIncidentNotes",
  "bugDocumentUrl",
  "testCaseTotal",
  "testCaseBeTotal",
  "testCaseBeExecuted",
  "testCaseFeTotal",
  "testCaseFeExecuted",
  "automationBeTotal",
  "automationFeTotal",
  "automationBePassed",
  "automationBeFailed",
  "automationFePassed",
  "automationFeFailed",
] as const;

export type ContentField = (typeof CONTENT_FIELDS)[number];

export function isContentField(fieldName: string): fieldName is ContentField {
  return (CONTENT_FIELDS as readonly string[]).includes(fieldName);
}

function isEqualish(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" && typeof b === "number") {
    return Number(a.toFixed(4)) === Number(b.toFixed(4));
  }
  return String(a) === String(b);
}

export function detectContentChanges(
  prev: Partial<Record<ContentField, unknown>>,
  next: Partial<Record<ContentField, unknown>>,
): ContentField[] {
  const changed: ContentField[] = [];
  for (const field of CONTENT_FIELDS) {
    if (!isEqualish(prev[field], next[field])) changed.push(field);
  }
  return changed;
}
