import type { ReportStatus, Role } from "@/types";

export function countByStatus(reports: { status: ReportStatus }[]): Record<ReportStatus, number> {
  const counts: Record<ReportStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    REVIEWED: 0,
    NEED_REVISION: 0,
    APPROVED: 0,
  };

  for (const report of reports) {
    counts[report.status] += 1;
  }

  return counts;
}

export function aggregateTopBlockers(rows: { blocker: string | null }[], limit = 5) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.blocker) continue;
    const lines = row.blocker
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    for (const text of lines) {
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([blocker, value]) => ({ blocker, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function scopeReportsForRole<T extends { userId: string }>(
  reports: T[],
  role: Role,
  userId: string,
): T[] {
  if (role === "QA_LEAD" || role === "ADMIN") {
    return reports;
  }
  return reports.filter((report) => report.userId === userId);
}
