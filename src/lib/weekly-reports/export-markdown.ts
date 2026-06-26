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
  from: string;
  to: string;
  projectName: string;
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

export function buildWeeklyReportsMarkdown({ from, to, projectName, reports }: BuildArgs) {
  const lines: string[] = [
    "# Weekly QA Reports",
    "",
    "## Scope",
    projectName,
    "",
    "## Period",
    `${from} – ${to}`,
    "",
    `## Reports (${reports.length})`,
    "",
  ];

  if (reports.length === 0) {
    lines.push("Tidak ada approved report pada periode ini.", "");
    return lines.join("\n");
  }

  for (const report of reports) {
    lines.push(...renderReport(report), "");
  }

  return lines.join("\n");
}

export function weeklyExportFilename(projectName: string | undefined, from: string, to: string) {
  const base = (projectName ?? "All projects")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${from}-to-${to}.md`;
}
