import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, weeklyReports } from "@/db/schema";

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
