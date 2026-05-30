import type { ReportStatus } from "@/types";

export function canEditReport(status: ReportStatus): boolean {
  return status !== "APPROVED";
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
