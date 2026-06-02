import type { MonthlySummary } from "./queries";
import { formatMarkdownBullet } from "@/lib/reports/bullets";

type BuildArgs = {
  projectName: string;
  month: string;
  summary: MonthlySummary;
};

export function buildMonthlyMarkdown({ projectName, month, summary }: BuildArgs) {
  const lines = [
    "# Monthly QA Report",
    "",
    "## Project",
    projectName,
    "",
    "## Period",
    month,
    "",
    "## Summary",
    `Ringkasan progress QA selama periode ini (${summary.reportCount} approved report).`,
    "",
    "## Metrics",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Production Incident | ${summary.productionIncident} |`,
    `| Test Case Total | ${summary.testCaseTotal} |`,
    `| Test Case BE | ${summary.testCaseBe} |`,
    `| Test Case FE | ${summary.testCaseFe} |`,
    `| Automation BE | ${summary.automationBe} |`,
    `| Automation FE | ${summary.automationFe} |`,
    `| Automation BE Coverage | ${summary.avgAutomationBe.toFixed(2)}% |`,
    `| Automation FE Coverage | ${summary.avgAutomationFe.toFixed(2)}% |`,
    `| Automation BE Pass Rate | ${summary.avgAutomationBePassRate.toFixed(2)}% |`,
    `| Automation FE Pass Rate | ${summary.avgAutomationFePassRate.toFixed(2)}% |`,
    "",
    "## Blockers",
    ...(summary.blockers.length ? summary.blockers.map(formatMarkdownBullet) : ["- Tidak ada blocker."]),
    "",
    "## Next Month Plan",
    ...(summary.nextPlans.length ? summary.nextPlans.map(formatMarkdownBullet) : ["- Tidak ada next plan."]),
    "",
  ];

  return lines.join("\n");
}

export function monthlyExportFilename(projectName: string | undefined, month: string) {
  const base = (projectName ?? "All projects").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${month}.md`;
}
