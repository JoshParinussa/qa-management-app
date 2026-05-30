import { and, avg, eq, gte, lt, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, weeklyReports } from "@/db/schema";

export type MonthlyFilter = {
  month: string; // format YYYY-MM
  projectId?: string;
};

function monthRange(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return { start, end };
}

export async function getMonthlySummary(filter: MonthlyFilter) {
  const { start, end } = monthRange(filter.month);

  const conditions = [
    eq(weeklyReports.status, "APPROVED"),
    gte(weeklyReports.weekStartDate, start),
    lt(weeklyReports.weekStartDate, end),
  ];

  if (filter.projectId) {
    conditions.push(eq(weeklyReports.projectId, filter.projectId));
  }

  const where = and(...conditions);

  const [totals] = await db
    .select({
      productionIncident: sum(weeklyReports.productionIncidentCount),
      testCaseBe: sum(weeklyReports.testCaseBeTotal),
      testCaseFe: sum(weeklyReports.testCaseFeTotal),
      automationBe: sum(weeklyReports.automationBeTotal),
      automationFe: sum(weeklyReports.automationFeTotal),
      avgAutomation: avg(weeklyReports.automationCoverage),
      avgExecution: avg(weeklyReports.executionCoverage),
    })
    .from(weeklyReports)
    .where(where);

  const rows = await db
    .select({ blocker: weeklyReports.blocker, nextWeekPlan: weeklyReports.nextWeekPlan })
    .from(weeklyReports)
    .where(where);

  const blockers = rows.map((r) => r.blocker?.trim()).filter((v): v is string => Boolean(v));
  const nextPlans = rows.map((r) => r.nextWeekPlan?.trim()).filter((v): v is string => Boolean(v));

  return {
    productionIncident: Number(totals?.productionIncident ?? 0),
    testCaseBe: Number(totals?.testCaseBe ?? 0),
    testCaseFe: Number(totals?.testCaseFe ?? 0),
    automationBe: Number(totals?.automationBe ?? 0),
    automationFe: Number(totals?.automationFe ?? 0),
    avgAutomation: totals?.avgAutomation ? Number(totals.avgAutomation) : 0,
    avgExecution: totals?.avgExecution ? Number(totals.avgExecution) : 0,
    blockers,
    nextPlans,
    reportCount: rows.length,
  };
}

export type MonthlySummary = Awaited<ReturnType<typeof getMonthlySummary>>;

export function listActiveProjectsForFilter() {
  return db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .orderBy(projects.name);
}
