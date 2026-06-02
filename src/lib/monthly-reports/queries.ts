import { and, avg, eq, gte, lt, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, weeklyReports } from "@/db/schema";
import { parseBulletItems } from "@/lib/reports/bullets";

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
      testCaseTotal: sum(weeklyReports.testCaseTotal),
      testCaseBe: sum(weeklyReports.testCaseBeTotal),
      testCaseFe: sum(weeklyReports.testCaseFeTotal),
      automationBe: sum(weeklyReports.automationBeTotal),
      automationFe: sum(weeklyReports.automationFeTotal),
      avgAutomation: avg(weeklyReports.automationCoverage),
      avgAutomationBe: avg(weeklyReports.automationBeCoverage),
      avgAutomationFe: avg(weeklyReports.automationFeCoverage),
      avgAutomationBePassRate: avg(weeklyReports.automationBePassRate),
      avgAutomationFePassRate: avg(weeklyReports.automationFePassRate),
      avgExecution: avg(weeklyReports.executionCoverage),
    })
    .from(weeklyReports)
    .where(where);

  const rows = await db
    .select({ blocker: weeklyReports.blocker, nextWeekPlan: weeklyReports.nextWeekPlan })
    .from(weeklyReports)
    .where(where);

  const blockers = rows.flatMap((r) => parseBulletItems(r.blocker));
  const nextPlans = rows.flatMap((r) => parseBulletItems(r.nextWeekPlan));

  return {
    productionIncident: Number(totals?.productionIncident ?? 0),
    testCaseTotal: Number(totals?.testCaseTotal ?? 0),
    testCaseBe: Number(totals?.testCaseBe ?? 0),
    testCaseFe: Number(totals?.testCaseFe ?? 0),
    automationBe: Number(totals?.automationBe ?? 0),
    automationFe: Number(totals?.automationFe ?? 0),
    avgAutomation: totals?.avgAutomation ? Number(totals.avgAutomation) : 0,
    avgAutomationBe: totals?.avgAutomationBe ? Number(totals.avgAutomationBe) : 0,
    avgAutomationFe: totals?.avgAutomationFe ? Number(totals.avgAutomationFe) : 0,
    avgAutomationBePassRate: totals?.avgAutomationBePassRate ? Number(totals.avgAutomationBePassRate) : 0,
    avgAutomationFePassRate: totals?.avgAutomationFePassRate ? Number(totals.avgAutomationFePassRate) : 0,
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
