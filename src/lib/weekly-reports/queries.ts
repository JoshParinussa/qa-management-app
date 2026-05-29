import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, weeklyReports } from "@/db/schema";

export function listReportsByUser(userId: string) {
  return db
    .select({
      id: weeklyReports.id,
      projectId: weeklyReports.projectId,
      projectName: projects.name,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .where(eq(weeklyReports.userId, userId))
    .orderBy(desc(weeklyReports.weekStartDate));
}

export function listAllReports() {
  return db
    .select({
      id: weeklyReports.id,
      projectId: weeklyReports.projectId,
      projectName: projects.name,
      userId: weeklyReports.userId,
      weekStartDate: weeklyReports.weekStartDate,
      weekEndDate: weeklyReports.weekEndDate,
      status: weeklyReports.status,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .orderBy(desc(weeklyReports.weekStartDate));
}

export async function getReportById(id: string) {
  const [report] = await db.select().from(weeklyReports).where(eq(weeklyReports.id, id)).limit(1);
  return report ?? null;
}

export async function findReportForWeek(projectId: string, userId: string, weekStartDate: Date, weekEndDate: Date) {
  const [report] = await db
    .select()
    .from(weeklyReports)
    .where(
      and(
        eq(weeklyReports.projectId, projectId),
        eq(weeklyReports.userId, userId),
        eq(weeklyReports.weekStartDate, weekStartDate),
        eq(weeklyReports.weekEndDate, weekEndDate),
      ),
    )
    .limit(1);

  return report ?? null;
}
