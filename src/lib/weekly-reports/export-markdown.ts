import type { ReportStatus } from "@/types";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { formatMarkdownBullet, parseBulletItems } from "@/lib/reports/bullets";
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

type BuildArgs = {
  projectLabel: string;
  statusLabel: string;
  periodLabel?: string;
  reports: WeeklyReportExportRow[];
};

function renderBullets(value: string | null, emptyText: string): string[] {
  const items = parseBulletItems(value);
  return items.length ? items.map(formatMarkdownBullet) : [emptyText];
}

function renderIncidents(report: WeeklyReportExportRow): string[] {
  const incidents = parseIncidents(report.productionIncidentNotes);
  const lines: string[] = [`#### Production incidents (${report.productionIncidentCount})`];

  if (incidents.length === 0) {
    lines.push(report.productionIncidentCount > 0 ? "- Belum ada detail incident." : "- Tidak ada production incident.");
  } else {
    for (const incident of incidents) {
      const title = incident.title || "(tanpa judul)";
      const suffix = incident.relatedTestCaseId ? ` (${incident.relatedTestCaseId})` : "";
      lines.push(`- ${title}${suffix}`);
      if (incident.description) {
        lines.push(`  ${incident.description}`);
      }
    }
  }

  if (report.bugDocumentUrl) {
    lines.push("", `Bug document: ${report.bugDocumentUrl}`);
  }

  return lines;
}

function renderReport(report: WeeklyReportExportRow): string[] {
  const metrics = calculateReportMetrics(report);

  return [
    `### ${report.projectName} — ${formatReportDate(report.weekStartDate)} → ${formatReportDate(report.weekEndDate)}`,
    `- Status: ${formatReportStatus(report.status)}`,
    `- Reviewed by: ${report.reviewerName ?? "—"}`,
    `- Approved by: ${report.approverName ?? "—"}`,
    "",
    "#### Summary",
    ...renderBullets(report.summary, "- -"),
    "",
    "#### Metrics",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Total test case | ${metrics.totalTestCase} |`,
    `| Total automated | ${report.automationBeTotal + report.automationFeTotal} |`,
    `| BE test case | ${report.testCaseBeTotal} |`,
    `| BE automated | ${report.automationBeTotal} |`,
    `| BE automation coverage | ${metrics.automationBeCoverage}% |`,
    `| BE pass rate | ${metrics.automationBePassRate}% |`,
    `| FE test case | ${report.testCaseFeTotal} |`,
    `| FE automated | ${report.automationFeTotal} |`,
    `| FE automation coverage | ${metrics.automationFeCoverage}% |`,
    `| FE pass rate | ${metrics.automationFePassRate}% |`,
    "",
    ...renderIncidents(report),
    "",
    "#### Blocker",
    ...renderBullets(report.blocker, "- Tidak ada blocker."),
    "",
    "#### Next week plan",
    ...renderBullets(report.nextWeekPlan, "- Tidak ada next plan."),
    "",
    "#### Notes",
    report.notes?.trim() ? report.notes : "-",
    "",
    "---",
  ];
}

export function buildWeeklyReportsMarkdown({ projectLabel, statusLabel, periodLabel, reports }: BuildArgs) {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# Weekly QA Reports",
    "",
    "## Filter",
    `- Project: ${projectLabel}`,
    `- Status: ${statusLabel}`,
    `- Period: ${periodLabel ?? "All time"}`,
    `- Generated: ${generatedAt}`,
    "",
    `## Reports (${reports.length})`,
    "",
  ];

  if (reports.length === 0) {
    lines.push("Tidak ada report yang cocok dengan filter ini.", "");
    return lines.join("\n");
  }

  for (const report of reports) {
    lines.push(...renderReport(report), "");
  }

  return lines.join("\n");
}

export function weeklyExportFilename(projectLabel: string, statusLabel: string) {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `weekly-reports-${slug(projectLabel) || "all"}-${slug(statusLabel) || "all"}-${date}.md`;
}
