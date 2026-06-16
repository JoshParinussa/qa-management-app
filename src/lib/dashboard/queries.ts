import { and, avg, count, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, projects, reportAuthors, reportQaApprovals, weeklyReports } from "@/db/schema";
import { aggregateTopBlockers } from "@/lib/dashboard/aggregate";
import type { DashboardDateRange } from "@/lib/dashboard/date-range";

function reportOverlapsRange(range: DashboardDateRange) {
  return and(
    lte(weeklyReports.weekStartDate, range.end),
    gte(weeklyReports.weekEndDate, range.start),
  );
}

export async function getDashboardSummary(range: DashboardDateRange) {
  const [activeProjects] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.status, "ACTIVE"));

  const [pendingReview] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.status, "SUBMITTED"), reportOverlapsRange(range)));

  const [needRevision] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.status, "NEED_REVISION"), reportOverlapsRange(range)));

  const [approved] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.status, "APPROVED"), reportOverlapsRange(range)));

  return {
    activeProjects: activeProjects?.value ?? 0,
    pendingReview: pendingReview?.value ?? 0,
    needRevision: needRevision?.value ?? 0,
    approved: approved?.value ?? 0,
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;

export function listPendingReviewReports(range: DashboardDateRange, limit = 5) {
  return db
    .select({
      id: weeklyReports.id,
      projectName: projects.name,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .where(and(eq(weeklyReports.status, "SUBMITTED"), reportOverlapsRange(range)))
    .orderBy(desc(weeklyReports.submittedAt))
    .limit(limit);
}

export function listCoverageByProject(range: DashboardDateRange) {
  return db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      avgAutomationBe: avg(weeklyReports.automationBeCoverage),
      avgAutomationFe: avg(weeklyReports.automationFeCoverage),
      avgAutomationBePassRate: avg(weeklyReports.automationBePassRate),
      avgAutomationFePassRate: avg(weeklyReports.automationFePassRate),
      reportCount: count(),
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .where(and(eq(weeklyReports.status, "APPROVED"), reportOverlapsRange(range)))
    .groupBy(projects.id, projects.name)
    .orderBy(projects.name);
}

export async function getIncidentTotal(range: DashboardDateRange) {
  const [row] = await db
    .select({ value: sum(weeklyReports.productionIncidentCount) })
    .from(weeklyReports)
    .where(reportOverlapsRange(range));
  return Number(row?.value ?? 0);
}

export async function listTopBlockers(limit = 5) {
  const rows = await db
    .select({ blocker: weeklyReports.blocker })
    .from(weeklyReports);

  return aggregateTopBlockers(rows, limit);
}

export async function getMemberSummary(userId: string, range: DashboardDateRange) {
  const countCoAuthoredReports = (status: "NEED_REVISION" | "APPROVED") =>
    db
      .select({ value: count() })
      .from(reportAuthors)
      .innerJoin(weeklyReports, eq(reportAuthors.weeklyReportId, weeklyReports.id))
      .where(and(
        eq(reportAuthors.userId, userId),
        eq(weeklyReports.status, status),
        reportOverlapsRange(range),
      ));

  const [assignedRows, pendingRows, revisionRows, approvedRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(projectMembers)
      .where(and(eq(projectMembers.userId, userId), isNull(projectMembers.removedAt))),
    db
      .select({ value: count() })
      .from(reportAuthors)
      .innerJoin(weeklyReports, eq(reportAuthors.weeklyReportId, weeklyReports.id))
      .leftJoin(
        reportQaApprovals,
        and(
          eq(reportQaApprovals.weeklyReportId, reportAuthors.weeklyReportId),
          eq(reportQaApprovals.userId, reportAuthors.userId),
        ),
      )
      .where(
        and(
          eq(reportAuthors.userId, userId),
          eq(weeklyReports.status, "PENDING_QA_APPROVAL"),
          isNull(reportQaApprovals.id),
          reportOverlapsRange(range),
        ),
      ),
    countCoAuthoredReports("NEED_REVISION"),
    countCoAuthoredReports("APPROVED"),
  ]);

  const [assignedProjects] = assignedRows;
  const [pendingApproval] = pendingRows;
  const [needRevision] = revisionRows;
  const [approved] = approvedRows;

  return {
    assignedProjects: assignedProjects?.value ?? 0,
    pendingApproval: pendingApproval?.value ?? 0,
    needRevision: needRevision?.value ?? 0,
    approved: approved?.value ?? 0,
  };
}

export type MemberSummary = Awaited<ReturnType<typeof getMemberSummary>>;

export function listRecentReportsByUser(userId: string, range?: DashboardDateRange, limit = 5) {
  return db
    .select({
      id: weeklyReports.id,
      projectName: projects.name,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
      needsMyApproval: sql<boolean>`${weeklyReports.status} = 'PENDING_QA_APPROVAL' and ${reportQaApprovals.id} is null`,
    })
    .from(reportAuthors)
    .innerJoin(weeklyReports, eq(reportAuthors.weeklyReportId, weeklyReports.id))
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .leftJoin(
      reportQaApprovals,
      and(
        eq(reportQaApprovals.weeklyReportId, reportAuthors.weeklyReportId),
        eq(reportQaApprovals.userId, reportAuthors.userId),
      ),
    )
    .where(and(eq(reportAuthors.userId, userId), range ? reportOverlapsRange(range) : undefined))
    .orderBy(desc(weeklyReports.weekStartDate))
    .limit(limit);
}
