import type { ReportStatus } from "@/types";
import { parseBulletItems } from "@/lib/reports/bullets";

type MonthlyRow = {
  status: ReportStatus;
  weekStartDate: Date;
  productionIncidentCount: number;
  testCaseTotal?: number | null;
  testCaseBeTotal: number;
  testCaseFeTotal: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationCoverage: string | null;
  automationBeCoverage?: string | null;
  automationFeCoverage?: string | null;
  automationBePassRate?: string | null;
  automationFePassRate?: string | null;
  executionCoverage: string | null;
  blocker: string | null;
  nextWeekPlan: string | null;
};

function monthRange(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return { start, end };
}

export function filterApprovedInMonth<T extends MonthlyRow>(reports: T[], month: string): T[] {
  const { start, end } = monthRange(month);
  return reports.filter(
    (r) => r.status === "APPROVED" && r.weekStartDate >= start && r.weekStartDate < end,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(2));
}

function numericValues(reports: MonthlyRow[], key: keyof MonthlyRow): number[] {
  return reports
    .map((r) => {
      const value = r[key];
      if (value == null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((v): v is number => v != null);
}

export function summarizeMonthlyReports(reports: MonthlyRow[]) {
  return {
    productionIncident: reports.reduce((acc, r) => acc + r.productionIncidentCount, 0),
    testCaseTotal: reports.reduce((acc, r) => acc + (r.testCaseTotal ?? 0), 0),
    testCaseBe: reports.reduce((acc, r) => acc + r.testCaseBeTotal, 0),
    testCaseFe: reports.reduce((acc, r) => acc + r.testCaseFeTotal, 0),
    automationBe: reports.reduce((acc, r) => acc + r.automationBeTotal, 0),
    automationFe: reports.reduce((acc, r) => acc + r.automationFeTotal, 0),
    avgAutomation: average(numericValues(reports, "automationCoverage")),
    avgAutomationBe: average(numericValues(reports, "automationBeCoverage")),
    avgAutomationFe: average(numericValues(reports, "automationFeCoverage")),
    avgAutomationBePassRate: average(numericValues(reports, "automationBePassRate")),
    avgAutomationFePassRate: average(numericValues(reports, "automationFePassRate")),
    avgExecution: average(numericValues(reports, "executionCoverage")),
    blockers: reports.flatMap((r) => parseBulletItems(r.blocker)),
    nextPlans: reports.flatMap((r) => parseBulletItems(r.nextWeekPlan)),
    reportCount: reports.length,
  };
}
