import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, projects, users, weeklyReports } from "@/db/schema";
import type { DashboardDateRange } from "@/lib/dashboard/date-range";
import type { ReportStatus } from "@/types";

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type WeeklyReportChecklistItem = {
  projectId: string;
  projectCode: string;
  projectName: string;
  assignees: {
    userId: string;
    name: string;
    assignmentRole: "QA_MEMBER" | "QA_PIC";
  }[];
  reportId: string | null;
  reportStatus: ReportStatus | null;
  isMissing: boolean;
};

export async function listWeeklyReportChecklist(range: DashboardDateRange): Promise<WeeklyReportChecklistItem[]> {
  const activeProjects = await db
    .select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
    })
    .from(projects)
    .where(and(eq(projects.status, "ACTIVE"), eq(projects.weeklyReportRequired, true)))
    .orderBy(asc(projects.name));

  if (activeProjects.length === 0) return [];

  const projectIds = activeProjects.map((project) => project.id);

  const [reports, assignees] = await Promise.all([
    db
      .select({
        id: weeklyReports.id,
        projectId: weeklyReports.projectId,
        status: weeklyReports.status,
      })
      .from(weeklyReports)
      .where(
        and(
          inArray(weeklyReports.projectId, projectIds),
          lte(weeklyReports.weekStartDate, range.end),
          gte(weeklyReports.weekEndDate, range.start),
        ),
      )
      .orderBy(desc(weeklyReports.weekStartDate)),
    db
      .select({
        projectId: projectMembers.projectId,
        userId: users.id,
        name: users.name,
        assignmentRole: projectMembers.assignmentRole,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(and(inArray(projectMembers.projectId, projectIds), isNull(projectMembers.removedAt)))
      .orderBy(asc(projectMembers.assignmentRole), asc(users.name)),
  ]);

  const reportByProjectId = new Map<(typeof reports)[number]["projectId"], (typeof reports)[number]>();
  for (const report of reports) {
    if (!reportByProjectId.has(report.projectId)) {
      reportByProjectId.set(report.projectId, report);
    }
  }
  const assigneesByProjectId = new Map<string, WeeklyReportChecklistItem["assignees"]>();

  for (const assignee of assignees) {
    const values = assigneesByProjectId.get(assignee.projectId) ?? [];
    values.push({
      userId: assignee.userId,
      name: assignee.name,
      assignmentRole: assignee.assignmentRole,
    });
    assigneesByProjectId.set(assignee.projectId, values);
  }

  return activeProjects.map((project) => {
    const report = reportByProjectId.get(project.id);

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      assignees: assigneesByProjectId.get(project.id) ?? [],
      reportId: report?.id ?? null,
      reportStatus: report?.status ?? null,
      isMissing: !report,
    };
  });
}

export function isValidDateValue(value?: string): value is string {
  if (!value || !DATE_VALUE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
