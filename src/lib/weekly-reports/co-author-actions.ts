"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reportQaApprovals, weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { ACTIVITY_ACTIONS, insertActivity } from "@/lib/weekly-reports/activity";
import {
  countApprovals,
  countAuthors,
  getReportById,
  hasUserApproved,
  isCoAuthor,
} from "@/lib/weekly-reports/queries";
import {
  canApproveAsCoAuthor,
  canRevokeApproval,
} from "@/lib/weekly-reports/transitions";
import type { ActionState } from "@/types";

/**
 * QA co-author records their approval on a PENDING_QA_APPROVAL report.
 * If this approval makes the count match the total co-authors, the report
 * is automatically transitioned to SUBMITTED (auto-submit to reviewer).
 */
export async function approveAsCoAuthorAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  const [coAuthor, alreadyApproved] = await Promise.all([
    isCoAuthor(id, user.id),
    hasUserApproved(id, user.id),
  ]);

  if (!canApproveAsCoAuthor(report.status, coAuthor, alreadyApproved)) {
    return { error: "Tidak bisa approve report ini." };
  }

  await db.insert(reportQaApprovals).values({
    weeklyReportId: id,
    userId: user.id,
  });

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVED,
  });

  const [approvals, authors] = await Promise.all([countApprovals(id), countAuthors(id)]);

  if (approvals >= authors && authors > 0) {
    const now = new Date();
    await db
      .update(weeklyReports)
      .set({
        status: "SUBMITTED",
        submittedAt: now,
        submittedBy: user.id,
        updatedAt: now,
      })
      .where(eq(weeklyReports.id, id));

    await insertActivity({
      weeklyReportId: id,
      actorId: user.id,
      action: ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER,
    });
  }

  redirect(`/weekly-reports/${id}`);
}

/**
 * QA co-author withdraws their previously-recorded approval.
 * Allowed only while the report is still in PENDING_QA_APPROVAL.
 */
export async function revokeMyApprovalAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  const [coAuthor, alreadyApproved] = await Promise.all([
    isCoAuthor(id, user.id),
    hasUserApproved(id, user.id),
  ]);

  if (!canRevokeApproval(report.status, coAuthor, alreadyApproved)) {
    return { error: "Tidak ada approval untuk dibatalkan." };
  }

  await db
    .delete(reportQaApprovals)
    .where(
      and(
        eq(reportQaApprovals.weeklyReportId, id),
        eq(reportQaApprovals.userId, user.id),
      ),
    );

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED,
  });

  redirect(`/weekly-reports/${id}`);
}
