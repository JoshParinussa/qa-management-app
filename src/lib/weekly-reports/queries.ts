import { and, count, desc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  projects,
  reportActivities,
  reportAuthors,
  reportFeedbacks,
  reportQaApprovals,
  users,
  weeklyReports,
} from "@/db/schema";

const reviewerUsers = alias(users, "reviewer_users");
const approverUsers = alias(users, "approver_users");
const submitterUsers = alias(users, "submitter_users");
const creatorUsers = alias(users, "creator_users");

export function listReportsByCoAuthor(userId: string) {
  return db
    .select({
      id: weeklyReports.id,
      projectId: weeklyReports.projectId,
      createdBy: weeklyReports.createdBy,
      submittedBy: weeklyReports.submittedBy,
      projectName: projects.name,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
      reviewerName: reviewerUsers.name,
      approverName: approverUsers.name,
      submitterName: submitterUsers.name,
    })
    .from(weeklyReports)
    .innerJoin(
      reportAuthors,
      and(
        eq(reportAuthors.weeklyReportId, weeklyReports.id),
        eq(reportAuthors.userId, userId),
      ),
    )
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .leftJoin(reviewerUsers, eq(weeklyReports.reviewedBy, reviewerUsers.id))
    .leftJoin(approverUsers, eq(weeklyReports.approvedBy, approverUsers.id))
    .leftJoin(submitterUsers, eq(weeklyReports.submittedBy, submitterUsers.id))
    .orderBy(desc(weeklyReports.createdAt));
}

/**
 * @deprecated Use listReportsByCoAuthor instead. Kept as alias to ease migration.
 */
export const listReportsByUser = listReportsByCoAuthor;

export function listAllReports() {
  return db
    .select({
      id: weeklyReports.id,
      projectId: weeklyReports.projectId,
      projectName: projects.name,
      createdBy: weeklyReports.createdBy,
      submittedBy: weeklyReports.submittedBy,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
      reviewerName: reviewerUsers.name,
      approverName: approverUsers.name,
      submitterName: submitterUsers.name,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .leftJoin(reviewerUsers, eq(weeklyReports.reviewedBy, reviewerUsers.id))
    .leftJoin(approverUsers, eq(weeklyReports.approvedBy, approverUsers.id))
    .leftJoin(submitterUsers, eq(weeklyReports.submittedBy, submitterUsers.id))
    .orderBy(desc(weeklyReports.createdAt));
}

export function listReportsForExportByIds(ids: string[]) {
  return db
    .select({
      projectName: projects.name,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
      reviewerName: reviewerUsers.name,
      approverName: approverUsers.name,
      summary: weeklyReports.summary,
      testCaseTotal: weeklyReports.testCaseTotal,
      testCaseBeTotal: weeklyReports.testCaseBeTotal,
      testCaseBeExecuted: weeklyReports.testCaseBeExecuted,
      testCaseFeTotal: weeklyReports.testCaseFeTotal,
      testCaseFeExecuted: weeklyReports.testCaseFeExecuted,
      automationBeTotal: weeklyReports.automationBeTotal,
      automationFeTotal: weeklyReports.automationFeTotal,
      automationBePassed: weeklyReports.automationBePassed,
      automationBeFailed: weeklyReports.automationBeFailed,
      automationFePassed: weeklyReports.automationFePassed,
      automationFeFailed: weeklyReports.automationFeFailed,
      automationPassed: weeklyReports.automationPassed,
      automationFailed: weeklyReports.automationFailed,
      productionIncidentCount: weeklyReports.productionIncidentCount,
      productionIncidentNotes: weeklyReports.productionIncidentNotes,
      bugDocumentUrl: weeklyReports.bugDocumentUrl,
      blocker: weeklyReports.blocker,
      nextWeekPlan: weeklyReports.nextWeekPlan,
      notes: weeklyReports.notes,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .leftJoin(reviewerUsers, eq(weeklyReports.reviewedBy, reviewerUsers.id))
    .leftJoin(approverUsers, eq(weeklyReports.approvedBy, approverUsers.id))
    .where(inArray(weeklyReports.id, ids))
    .orderBy(projects.name, weeklyReports.weekStartDate);
}

export function getReportByIdQuery(id: string) {
  return db
    .select({
      ...getTableColumns(weeklyReports),
      projectName: projects.name,
      projectCode: projects.code,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .where(eq(weeklyReports.id, id))
    .limit(1);
}

export async function getReportById(id: string) {
  const [report] = await getReportByIdQuery(id);
  return report ?? null;
}

export async function getReportReviewNames(reviewedBy: string | null, approvedBy: string | null) {
  const ids = [reviewedBy, approvedBy].filter((value): value is string => Boolean(value));

  if (ids.length === 0) {
    return { reviewerName: null, approverName: null };
  }

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, ids));

  const nameById = new Map(rows.map((row) => [row.id, row.name]));

  return {
    reviewerName: reviewedBy ? nameById.get(reviewedBy) ?? null : null,
    approverName: approvedBy ? nameById.get(approvedBy) ?? null : null,
  };
}

export async function findReportForWeek(projectId: string, weekStartDate: Date, weekEndDate: Date) {
  const [report] = await db
    .select()
    .from(weeklyReports)
    .where(
      and(
        eq(weeklyReports.projectId, projectId),
        eq(weeklyReports.weekStartDate, weekStartDate),
        eq(weeklyReports.weekEndDate, weekEndDate),
      ),
    )
    .limit(1);

  return report ?? null;
}

export async function findReportSummaryForWeek(projectId: string, weekStartDate: Date, weekEndDate: Date) {
  const [report] = await db
    .select({
      id: weeklyReports.id,
      status: weeklyReports.status,
      createdAt: weeklyReports.createdAt,
      createdByName: creatorUsers.name,
      createdByEmail: creatorUsers.email,
    })
    .from(weeklyReports)
    .innerJoin(creatorUsers, eq(weeklyReports.createdBy, creatorUsers.id))
    .where(
      and(
        eq(weeklyReports.projectId, projectId),
        eq(weeklyReports.weekStartDate, weekStartDate),
        eq(weeklyReports.weekEndDate, weekEndDate),
      ),
    )
    .limit(1);

  return report ?? null;
}

export function listReportFeedbacks(weeklyReportId: string) {
  return db
    .select({
      id: reportFeedbacks.id,
      feedback: reportFeedbacks.feedback,
      action: reportFeedbacks.action,
      createdAt: reportFeedbacks.createdAt,
      reviewerName: users.name,
    })
    .from(reportFeedbacks)
    .innerJoin(users, eq(reportFeedbacks.reviewerId, users.id))
    .where(eq(reportFeedbacks.weeklyReportId, weeklyReportId))
    .orderBy(desc(reportFeedbacks.createdAt));
}

// === Co-author / approval / activity queries ===

export function listReportAuthors(weeklyReportId: string) {
  return db
    .select({
      authorId: reportAuthors.id,
      userId: reportAuthors.userId,
      userName: users.name,
      userEmail: users.email,
      assignmentRole: reportAuthors.assignmentRole,
      addedAt: reportAuthors.addedAt,
      removedAt: reportAuthors.removedAt,
      isActive: users.isActive,
      approvedAt: reportQaApprovals.approvedAt,
    })
    .from(reportAuthors)
    .innerJoin(users, eq(reportAuthors.userId, users.id))
    .leftJoin(
      reportQaApprovals,
      and(
        eq(reportQaApprovals.weeklyReportId, reportAuthors.weeklyReportId),
        eq(reportQaApprovals.userId, reportAuthors.userId),
      ),
    )
    .where(eq(reportAuthors.weeklyReportId, weeklyReportId))
    .orderBy(reportAuthors.addedAt);
}

export async function isCoAuthor(weeklyReportId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: reportAuthors.id })
    .from(reportAuthors)
    .where(
      and(eq(reportAuthors.weeklyReportId, weeklyReportId), eq(reportAuthors.userId, userId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function hasUserApproved(weeklyReportId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: reportQaApprovals.id })
    .from(reportQaApprovals)
    .where(
      and(
        eq(reportQaApprovals.weeklyReportId, weeklyReportId),
        eq(reportQaApprovals.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function countApprovals(weeklyReportId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(reportQaApprovals)
    .innerJoin(
      reportAuthors,
      and(
        eq(reportAuthors.weeklyReportId, reportQaApprovals.weeklyReportId),
        eq(reportAuthors.userId, reportQaApprovals.userId),
      ),
    )
    .innerJoin(users, eq(reportAuthors.userId, users.id))
    .where(
      and(
        eq(reportQaApprovals.weeklyReportId, weeklyReportId),
        isNull(reportAuthors.removedAt),
        eq(users.isActive, true),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function countAuthors(weeklyReportId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(reportAuthors)
    .innerJoin(users, eq(reportAuthors.userId, users.id))
    .where(
      and(
        eq(reportAuthors.weeklyReportId, weeklyReportId),
        isNull(reportAuthors.removedAt),
        eq(users.isActive, true),
      ),
    );
  return Number(row?.value ?? 0);
}

export function listPendingReportIdsByAuthor(userId: string) {
  return db
    .select({ id: weeklyReports.id })
    .from(reportAuthors)
    .innerJoin(weeklyReports, eq(reportAuthors.weeklyReportId, weeklyReports.id))
    .where(
      and(
        eq(reportAuthors.userId, userId),
        eq(weeklyReports.status, "PENDING_QA_APPROVAL"),
      ),
    );
}

export function listReportActivities(weeklyReportId: string) {
  return db
    .select({
      id: reportActivities.id,
      action: reportActivities.action,
      changedFields: reportActivities.changedFields,
      note: reportActivities.note,
      createdAt: reportActivities.createdAt,
      actorId: reportActivities.actorId,
      actorName: users.name,
    })
    .from(reportActivities)
    .innerJoin(users, eq(reportActivities.actorId, users.id))
    .where(eq(reportActivities.weeklyReportId, weeklyReportId))
    .orderBy(desc(reportActivities.createdAt));
}
