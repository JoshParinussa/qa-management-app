"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { findActiveAssignment } from "@/lib/project-members/queries";
import { findReportForWeek, getReportById } from "@/lib/weekly-reports/queries";
import { weeklyReportSchema, type WeeklyReportInput } from "@/lib/validations/weekly-report";
import type { ActionState } from "@/types";

function parseReportForm(formData: FormData) {
  const num = (key: string) => Number(formData.get(key) ?? 0);

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
    automationPassed: num("automationPassed"),
    automationFailed: num("automationFailed"),
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
  };
}

export async function createDraftAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return { error: "Data report tidak valid. Periksa kembali isian." };
  }

  const assignment = await findActiveAssignment(parsed.data.projectId, user.id);

  if (!assignment) {
    return { error: "Kamu tidak ter-assign di project ini." };
  }

  const duplicate = await findReportForWeek(
    parsed.data.projectId,
    user.id,
    parsed.data.weekStartDate,
    parsed.data.weekEndDate,
  );

  if (duplicate) {
    return { error: "Report untuk project dan minggu ini sudah ada." };
  }

  const coverage = coverageValues(parsed.data);

  await db.insert(weeklyReports).values({
    ...parsed.data,
    userId: user.id,
    bugDocumentUrl: parsed.data.bugDocumentUrl || null,
    status: "DRAFT",
    ...coverage,
  });

  redirect("/weekly-reports");
}

export async function updateDraftAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report || report.userId !== user.id) {
    return { error: "Report tidak ditemukan." };
  }

  if (report.status === "APPROVED") {
    return { error: "Report yang sudah approved tidak bisa diedit." };
  }

  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return { error: "Data report tidak valid. Periksa kembali isian." };
  }

  const coverage = coverageValues(parsed.data);

  await db
    .update(weeklyReports)
    .set({
      ...parsed.data,
      bugDocumentUrl: parsed.data.bugDocumentUrl || null,
      ...coverage,
      updatedAt: new Date(),
    })
    .where(eq(weeklyReports.id, id));

  redirect(`/weekly-reports/${id}`);
}
