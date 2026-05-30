"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reportFeedbacks, weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { getReportById } from "@/lib/weekly-reports/queries";
import { canReviewReport, nextStatusForAction, type ReviewAction } from "@/lib/weekly-reports/transitions";
import type { ActionState } from "@/types";

async function requireReviewer() {
  const user = await requireUser();

  if (!can(user.role, "report:review")) {
    redirect("/dashboard");
  }

  return user;
}

async function applyReview(id: string, action: ReviewAction, feedback: string, requireFeedback: boolean): Promise<ActionState> {
  const reviewer = await requireReviewer();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  if (!canReviewReport(report.status)) {
    return { error: "Hanya report berstatus Submitted yang bisa direview." };
  }

  const trimmed = feedback.trim();

  if (requireFeedback && !trimmed) {
    return { error: "Feedback wajib diisi untuk meminta revisi." };
  }

  const now = new Date();
  const status = nextStatusForAction(action);

  await db
    .update(weeklyReports)
    .set({
      status,
      reviewedAt: now,
      reviewedBy: reviewer.id,
      approvedAt: action === "APPROVED" ? now : null,
      approvedBy: action === "APPROVED" ? reviewer.id : null,
      updatedAt: now,
    })
    .where(eq(weeklyReports.id, id));

  if (trimmed) {
    await db.insert(reportFeedbacks).values({
      weeklyReportId: id,
      reviewerId: reviewer.id,
      feedback: trimmed,
      action,
    });
  }

  redirect(`/weekly-reports/${id}`);
}

export async function markReviewedAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  return applyReview(id, "REVIEWED", String(formData.get("feedback") ?? ""), false);
}

export async function requestRevisionAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  return applyReview(id, "NEED_REVISION", String(formData.get("feedback") ?? ""), true);
}

export async function approveReportAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  return applyReview(id, "APPROVED", String(formData.get("feedback") ?? ""), false);
}
