import { and, avg, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, projects, weeklyReports } from "@/db/schema";

export async function getDashboardSummary() {
  const [activeProjects] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.status, "ACTIVE"));

  const [pendingReview] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(eq(weeklyReports.status, "SUBMITTED"));

  const [needRevision] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(eq(weeklyReports.status, "NEED_REVISION"));

  const [approved] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(eq(weeklyReports.status, "APPROVED"));

  return {
    activeProjects: activeProjects?.value ?? 0,
    pendingReview: pendingReview?.value ?? 0,
    needRevision: needRevision?.value ?? 0,
    approved: approved?.value ?? 0,
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;

export function listPendingReviewReports(limit = 5) {
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
    .where(eq(weeklyReports.status, "SUBMITTED"))
    .orderBy(desc(weeklyReports.submittedAt))
    .limit(limit);
}

export function listCoverageByProject() {
  return db
    .select({
      projectName: projects.name,
      avgAutomation: avg(weeklyReports.automationCoverage),
      avgExecution: avg(weeklyReports.executionCoverage),
      reportCount: count(),
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .where(eq(weeklyReports.status, "APPROVED"))
    .groupBy(projects.name)
    .orderBy(projects.name);
}

export async function getMemberSummary(userId: string) {
  const [assignedProjects] = await db
    .select({ value: count() })
    .from(projectMembers)
    .where(and(eq(projectMembers.userId, userId), isNull(projectMembers.removedAt)));

  const [needRevision] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.userId, userId), eq(weeklyReports.status, "NEED_REVISION")));

  const [submitted] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.userId, userId), eq(weeklyReports.status, "SUBMITTED")));

  const [approved] = await db
    .select({ value: count() })
    .from(weeklyReports)
    .where(and(eq(weeklyReports.userId, userId), eq(weeklyReports.status, "APPROVED")));

  return {
    assignedProjects: assignedProjects?.value ?? 0,
    needRevision: needRevision?.value ?? 0,
    submitted: submitted?.value ?? 0,
    approved: approved?.value ?? 0,
  };
}

export type MemberSummary = Awaited<ReturnType<typeof getMemberSummary>>;

export function listRecentReportsByUser(userId: string, limit = 5) {
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
    .where(eq(weeklyReports.userId, userId))
    .orderBy(desc(weeklyReports.weekStartDate))
    .limit(limit);
}
