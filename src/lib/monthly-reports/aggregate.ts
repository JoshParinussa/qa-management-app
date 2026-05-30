import type { ReportStatus } from "@/types";

type MonthlyRow = {
  status: ReportStatus;
  weekStartDate: Date;
  productionIncidentCount: number;
  testCaseBeTotal: number;
  testCaseFeTotal: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationCoverage: string | null;
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

export function summarizeMonthlyReports(reports: MonthlyRow[]) {
  const automationValues = reports
    .map((r) => (r.automationCoverage == null ? null : Number(r.automationCoverage)))
    .filter((v): v is number => v != null);
  const executionValues = reports
    .map((r) => (r.executionCoverage == null ? null : Number(r.executionCoverage)))
    .filter((v): v is number => v != null);

  return {
    productionIncident: reports.reduce((acc, r) => acc + r.productionIncidentCount, 0),
    testCaseBe: reports.reduce((acc, r) => acc + r.testCaseBeTotal, 0),
    testCaseFe: reports.reduce((acc, r) => acc + r.testCaseFeTotal, 0),
    automationBe: reports.reduce((acc, r) => acc + r.automationBeTotal, 0),
    automationFe: reports.reduce((acc, r) => acc + r.automationFeTotal, 0),
    avgAutomation: average(automationValues),
    avgExecution: average(executionValues),
    blockers: reports.map((r) => r.blocker?.trim()).filter((v): v is string => Boolean(v)),
    nextPlans: reports.map((r) => r.nextWeekPlan?.trim()).filter((v): v is string => Boolean(v)),
    reportCount: reports.length,
  };
}
