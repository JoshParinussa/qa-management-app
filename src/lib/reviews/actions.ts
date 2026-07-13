"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { reportFeedbacks, reportQaApprovals, weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { getReportById } from "@/lib/weekly-reports/queries";
import { canReviewReport, nextStatusForAction, type ReviewAction } from "@/lib/weekly-reports/transitions";
import { validateReviewFeedback } from "@/lib/reviews/review-rules";
import { ACTIVITY_ACTIONS, insertActivity, type ActivityAction } from "@/lib/weekly-reports/activity";
import type { ActionState } from "@/types";

type BulkApproveState = ActionState & {
  approvedCount?: number;
  skippedCount?: number;
};

async function requireReviewer() {
  const user = await requireUser();

  if (!can(user.role, "report:review")) {
    redirect("/dashboard");
  }

  return user;
}

const REVIEW_ACTIVITY: Record<ReviewAction, ActivityAction> = {
  NEED_REVISION: ACTIVITY_ACTIONS.REVISION_REQUESTED,
  APPROVED: ACTIVITY_ACTIONS.APPROVED,
};

async function applyReview(id: string, action: ReviewAction, feedback: string): Promise<ActionState> {
  const reviewer = await requireReviewer();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  if (!canReviewReport(report.status)) {
    return { error: "Hanya report berstatus Submitted yang bisa direview." };
  }

  const trimmed = feedback.trim();

  const feedbackCheck = validateReviewFeedback(action, feedback);
  if (!feedbackCheck.ok) {
    return { error: feedbackCheck.error };
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

  // Reviewer requested revision: reset all QA approvals so the team must re-approve.
  if (action === "NEED_REVISION") {
    const deleted = await db
      .delete(reportQaApprovals)
      .where(eq(reportQaApprovals.weeklyReportId, id))
      .returning({ id: reportQaApprovals.id });

    if (deleted.length > 0) {
      await insertActivity({
        weeklyReportId: id,
        actorId: reviewer.id,
        action: ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED,
      });
    }
  }

  await insertActivity({
    weeklyReportId: id,
    actorId: reviewer.id,
    action: REVIEW_ACTIVITY[action],
    note: trimmed || null,
  });

  redirect(`/weekly-reports/${id}`);
}

export async function requestRevisionAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  return applyReview(id, "NEED_REVISION", String(formData.get("feedback") ?? ""));
}

export async function approveReportAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  return applyReview(id, "APPROVED", String(formData.get("feedback") ?? ""));
}

export async function bulkApproveReportsAction(reportIds: string[]): Promise<BulkApproveState> {
  const reviewer = await requireReviewer();
  const uniqueIds = [...new Set(reportIds.map((id) => id.trim()).filter(Boolean))];

  if (uniqueIds.length === 0) {
    return { error: "Pilih minimal satu report untuk di-approve.", approvedCount: 0, skippedCount: 0 };
  }

  const now = new Date();
  const approvedReports = await db
    .update(weeklyReports)
    .set({
      status: "APPROVED",
      reviewedAt: now,
      reviewedBy: reviewer.id,
      approvedAt: now,
      approvedBy: reviewer.id,
      updatedAt: now,
    })
    .where(and(inArray(weeklyReports.id, uniqueIds), eq(weeklyReports.status, "SUBMITTED")))
    .returning({ id: weeklyReports.id });

  await Promise.all(
    approvedReports.map((report) =>
      insertActivity({
        weeklyReportId: report.id,
        actorId: reviewer.id,
        action: ACTIVITY_ACTIONS.APPROVED,
      }),
    ),
  );

  revalidatePath("/dashboard");
  revalidatePath("/weekly-reports");

  const approvedCount = approvedReports.length;
  const skippedCount = uniqueIds.length - approvedCount;

  if (approvedCount === 0) {
    return {
      error: "Tidak ada report Submitted yang bisa di-approve.",
      approvedCount,
      skippedCount,
    };
  }

  return {
    success: skippedCount > 0
      ? `${approvedCount} report berhasil di-approve. ${skippedCount} report dilewati karena bukan Submitted.`
      : `${approvedCount} report berhasil di-approve.`,
    approvedCount,
    skippedCount,
  };
}
