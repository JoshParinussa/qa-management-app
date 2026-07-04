import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { weeklyReports } from "@/db/schema";
import { ACTIVITY_ACTIONS, insertActivity } from "@/lib/weekly-reports/activity";
import {
  countApprovals,
  countAuthors,
  listPendingReportIdsByAuthor,
} from "@/lib/weekly-reports/queries";

export function hasAllRequiredApprovals(approved: number, required: number): boolean {
  return approved >= required;
}

export async function submitReportIfApprovalComplete(
  reportId: string,
  actorId: string,
  note?: string,
): Promise<boolean> {
  const [approved, required] = await Promise.all([
    countApprovals(reportId),
    countAuthors(reportId),
  ]);

  if (!hasAllRequiredApprovals(approved, required)) return false;

  const now = new Date();
  const updated = await db
    .update(weeklyReports)
    .set({
      status: "SUBMITTED",
      submittedAt: now,
      submittedBy: actorId,
      updatedAt: now,
    })
    .where(
      and(
        eq(weeklyReports.id, reportId),
        eq(weeklyReports.status, "PENDING_QA_APPROVAL"),
      ),
    )
    .returning({ id: weeklyReports.id });

  if (updated.length === 0) return false;

  await insertActivity({
    weeklyReportId: reportId,
    actorId,
    action: ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER,
    note,
  });

  return true;
}

export async function reconcileReportsAfterUserDeactivation(
  userId: string,
  actorId: string,
): Promise<void> {
  const reports = await listPendingReportIdsByAuthor(userId);

  await Promise.all(
    reports.map(({ id }) =>
      submitReportIfApprovalComplete(
        id,
        actorId,
        "Auto-submitted karena approval QA inactive tidak lagi diwajibkan.",
      ),
    ),
  );
}
