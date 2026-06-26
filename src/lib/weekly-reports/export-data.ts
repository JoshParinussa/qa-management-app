import type { ReportStatus } from "@/types";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { parseBulletItems } from "@/lib/reports/bullets";
import { parseIncidents } from "@/lib/reports/incidents";
import { formatReportDate } from "@/lib/reports/format";
import { formatReportStatus } from "@/lib/reports/status";

export type WeeklyReportExportRow = {
  projectName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  status: ReportStatus;
  reviewerName: string | null;
  approverName: string | null;
  summary: string;
  testCaseTotal: number | null;
  testCaseBeTotal: number;
  testCaseBeExecuted: number;
  testCaseFeTotal: number;
  testCaseFeExecuted: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationBePassed: number | null;
  automationBeFailed: number | null;
  automationFePassed: number | null;
  automationFeFailed: number | null;
  automationPassed: number;
  automationFailed: number;
  productionIncidentCount: number;
  productionIncidentNotes: string | null;
  bugDocumentUrl: string | null;
  blocker: string | null;
  nextWeekPlan: string;
  notes: string | null;
};

export type ExportIncident = {
  title: string;
  description: string;
  relatedTestCaseId: string;
};

export type ExportMetric = { label: string; value: string };

export type ExportReportSection = {
  title: string;
  weekRange: string;
  status: string;
  reviewerName: string;
  approverName: string;
  summary: string[];
  metrics: ExportMetric[];
  incidentCount: number;
  incidents: ExportIncident[];
  bugDocumentUrl: string | null;
  blocker: string[];
  nextWeekPlan: string[];
  notes: string;
};

export type WeeklyReportsExportData = {
  projectLabel: string;
  statusLabel: string;
  periodLabel: string;
  generatedAt: string;
  reportCount: number;
  reports: ExportReportSection[];
};

type BuildArgs = {
  projectLabel: string;
  statusLabel: string;
  periodLabel?: string;
  reports: WeeklyReportExportRow[];
};

function buildSection(report: WeeklyReportExportRow): ExportReportSection {
  const metrics = calculateReportMetrics(report);
  const incidents = parseIncidents(report.productionIncidentNotes);

  return {
    title: report.projectName,
    weekRange: `${formatReportDate(report.weekStartDate)} → ${formatReportDate(report.weekEndDate)}`,
    status: formatReportStatus(report.status),
    reviewerName: report.reviewerName ?? "—",
    approverName: report.approverName ?? "—",
    summary: parseBulletItems(report.summary),
    metrics: [
      { label: "Total test case", value: String(metrics.totalTestCase) },
      { label: "Total automated", value: String(report.automationBeTotal + report.automationFeTotal) },
      { label: "BE test case", value: String(report.testCaseBeTotal) },
      { label: "BE automated", value: String(report.automationBeTotal) },
      { label: "BE automation coverage", value: `${metrics.automationBeCoverage}%` },
      { label: "BE pass rate", value: `${metrics.automationBePassRate}%` },
      { label: "FE test case", value: String(report.testCaseFeTotal) },
      { label: "FE automated", value: String(report.automationFeTotal) },
      { label: "FE automation coverage", value: `${metrics.automationFeCoverage}%` },
      { label: "FE pass rate", value: `${metrics.automationFePassRate}%` },
    ],
    incidentCount: report.productionIncidentCount,
    incidents,
    bugDocumentUrl: report.bugDocumentUrl,
    blocker: parseBulletItems(report.blocker),
    nextWeekPlan: parseBulletItems(report.nextWeekPlan),
    notes: report.notes?.trim() ? report.notes : "-",
  };
}

export function buildWeeklyReportsExportData({
  projectLabel,
  statusLabel,
  periodLabel,
  reports,
}: BuildArgs): WeeklyReportsExportData {
  return {
    projectLabel,
    statusLabel,
    periodLabel: periodLabel ?? "All time",
    generatedAt: new Date().toISOString().slice(0, 10),
    reportCount: reports.length,
    reports: reports.map(buildSection),
  };
}

export function weeklyExportFilename(projectLabel: string, statusLabel: string) {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `weekly-reports-${slug(projectLabel) || "all"}-${slug(statusLabel) || "all"}-${date}.pdf`;
}
