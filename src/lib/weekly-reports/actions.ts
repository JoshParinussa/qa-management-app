"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { findActiveAssignment } from "@/lib/project-members/queries";
import { hasActiveAssignment } from "@/lib/project-members/rules";
import { canEditReport, validateSubmitReadiness } from "@/lib/weekly-reports/rules";
import { findReportForWeek, getReportById } from "@/lib/weekly-reports/queries";
import { canSubmitReport } from "@/lib/weekly-reports/transitions";
import { weeklyReportSchema, type WeeklyReportInput } from "@/lib/validations/weekly-report";
import type { ActionState } from "@/types";
import { weeklyReportErrorState, type WeeklyReportActionState } from "./form-state";

function parseReportForm(formData: FormData) {
  const num = (key: string) => Number(formData.get(key) ?? 0);
  const optionalNum = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return undefined;
    return Number(raw);
  };
  const optionalNumbers = {
    testCaseTotal: optionalNum("testCaseTotal"),
    automationBePassed: optionalNum("automationBePassed"),
    automationBeFailed: optionalNum("automationBeFailed"),
    automationFePassed: optionalNum("automationFePassed"),
    automationFeFailed: optionalNum("automationFeFailed"),
  };
  const splitAutomationPresent =
    optionalNumbers.automationBePassed !== undefined ||
    optionalNumbers.automationBeFailed !== undefined ||
    optionalNumbers.automationFePassed !== undefined ||
    optionalNumbers.automationFeFailed !== undefined;
  const optionalEntries = Object.fromEntries(
    Object.entries(optionalNumbers).filter(([, value]) => value !== undefined),
  );

  return weeklyReportSchema.safeParse({
    projectId: formData.get("projectId"),
    weekStartDate: formData.get("weekStartDate"),
    weekEndDate: formData.get("weekEndDate"),
    summary: formData.get("summary"),
    productionIncidentCount: num("productionIncidentCount"),
    productionIncidentNotes: String(formData.get("productionIncidentNotes") ?? "") || undefined,
    bugDocumentUrl: String(formData.get("bugDocumentUrl") ?? ""),
    testCaseBeTotal: num("testCaseBeTotal"),
    testCaseBeExecuted: num("testCaseBeExecuted"),
    testCaseFeTotal: num("testCaseFeTotal"),
    testCaseFeExecuted: num("testCaseFeExecuted"),
    automationBeTotal: num("automationBeTotal"),
    automationFeTotal: num("automationFeTotal"),
    ...optionalEntries,
    automationPassed: splitAutomationPresent
      ? (optionalNumbers.automationBePassed ?? 0) + (optionalNumbers.automationFePassed ?? 0)
      : num("automationPassed"),
    automationFailed: splitAutomationPresent
      ? (optionalNumbers.automationBeFailed ?? 0) + (optionalNumbers.automationFeFailed ?? 0)
      : num("automationFailed"),
    blocker: String(formData.get("blocker") ?? "") || undefined,
    nextWeekPlan: formData.get("nextWeekPlan"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
}

function coverageValues(data: WeeklyReportInput) {
  const metrics = calculateReportMetrics(data);
  return {
    automationCoverage: String(metrics.automationCoverage),
    executionCoverage: String(metrics.executionCoverage),
    automationBeCoverage: String(metrics.automationBeCoverage),
    automationFeCoverage: String(metrics.automationFeCoverage),
    automationBePassRate: String(metrics.automationBePassRate),
    automationFePassRate: String(metrics.automationFePassRate),
  };
}

function nullableSplitValues(data: WeeklyReportInput) {
  return {
    testCaseTotal: data.testCaseTotal ?? null,
    automationBePassed: data.automationBePassed ?? null,
    automationBeFailed: data.automationBeFailed ?? null,
    automationFePassed: data.automationFePassed ?? null,
    automationFeFailed: data.automationFeFailed ?? null,
  };
}

export async function createDraftAction(_state: WeeklyReportActionState, formData: FormData): Promise<WeeklyReportActionState> {
  const user = await requireUser();
  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return weeklyReportErrorState("Data report tidak valid. Periksa kembali isian.", formData);
  }

  const assignment = await findActiveAssignment(parsed.data.projectId, user.id);

  if (!hasActiveAssignment(assignment)) {
    return weeklyReportErrorState("Kamu tidak ter-assign di project ini.", formData);
  }

  const duplicate = await findReportForWeek(
    parsed.data.projectId,
    user.id,
    parsed.data.weekStartDate,
    parsed.data.weekEndDate,
  );

  if (duplicate) {
    return weeklyReportErrorState("Report untuk project dan minggu ini sudah ada.", formData);
  }

  const coverage = coverageValues(parsed.data);

  await db.insert(weeklyReports).values({
    ...parsed.data,
    ...nullableSplitValues(parsed.data),
    userId: user.id,
    bugDocumentUrl: parsed.data.bugDocumentUrl || null,
    status: "DRAFT",
    ...coverage,
  });

  redirect("/weekly-reports");
}

export async function updateDraftAction(id: string, _state: WeeklyReportActionState, formData: FormData): Promise<WeeklyReportActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report || report.userId !== user.id) {
    return { error: "Report tidak ditemukan." };
  }

  if (!canEditReport(report.status)) {
    return { error: "Report yang sudah approved tidak bisa diedit." };
  }

  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return weeklyReportErrorState("Data report tidak valid. Periksa kembali isian.", formData);
  }

  const coverage = coverageValues(parsed.data);

  await db
    .update(weeklyReports)
    .set({
      ...parsed.data,
      ...nullableSplitValues(parsed.data),
      bugDocumentUrl: parsed.data.bugDocumentUrl || null,
      ...coverage,
      updatedAt: new Date(),
    })
    .where(eq(weeklyReports.id, id));

  redirect(`/weekly-reports/${id}`);
}

export async function submitReportAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report || report.userId !== user.id) {
    return { error: "Report tidak ditemukan." };
  }

  if (!canSubmitReport(report.status)) {
    return { error: "Report ini tidak bisa disubmit dari status sekarang." };
  }

  const readiness = validateSubmitReadiness({
    summary: report.summary,
    nextWeekPlan: report.nextWeekPlan,
  });

  if (!readiness.ok) {
    return { error: readiness.error };
  }

  await db
    .update(weeklyReports)
    .set({ status: "SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(weeklyReports.id, id));

  redirect(`/weekly-reports/${id}`);
}
