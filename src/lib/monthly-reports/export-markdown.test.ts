import { describe, expect, it } from "vitest";
import { buildMonthlyMarkdown, monthlyExportFilename } from "./export-markdown";

const summary = {
  productionIncident: 0,
  testCaseBe: 120,
  testCaseFe: 180,
  automationBe: 80,
  automationFe: 90,
  avgAutomation: 56.67,
  avgExecution: 92,
  blockers: ["Blocker 1", "Blocker 2"],
  nextPlans: ["Plan 1"],
  reportCount: 4,
};

describe("buildMonthlyMarkdown", () => {
  it("includes project name and period", () => {
    const md = buildMonthlyMarkdown({ projectName: "UHealth Frontend", month: "2026-05", summary });
    expect(md).toContain("# Monthly QA Report");
    expect(md).toContain("UHealth Frontend");
    expect(md).toContain("2026-05");
  });

  it("includes metrics table values", () => {
    const md = buildMonthlyMarkdown({ projectName: "All projects", month: "2026-05", summary });
    expect(md).toContain("| Test Case BE | 120 |");
    expect(md).toContain("| Automation Coverage | 56.67% |");
  });

  it("lists blockers and next plans", () => {
    const md = buildMonthlyMarkdown({ projectName: "All projects", month: "2026-05", summary });
    expect(md).toContain("- Blocker 1");
    expect(md).toContain("- Plan 1");
  });
});

describe("monthlyExportFilename", () => {
  it("builds filename from project and month", () => {
    expect(monthlyExportFilename("UHealth Frontend", "2026-05")).toBe("uhealth-frontend-2026-05.md");
  });

  it("uses all-projects when no project name", () => {
    expect(monthlyExportFilename(undefined, "2026-05")).toBe("all-projects-2026-05.md");
  });
});
