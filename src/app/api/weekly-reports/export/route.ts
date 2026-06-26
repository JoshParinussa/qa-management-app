import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { parseDashboardDateRange } from "@/lib/dashboard/date-range";
import {
  listApprovedReportsForExport,
  listProjectsForExportFilter,
} from "@/lib/weekly-reports/queries";
import {
  buildWeeklyReportsMarkdown,
  weeklyExportFilename,
} from "@/lib/weekly-reports/export-markdown";

export async function GET(request: Request) {
  const user = await requireUser();

  if (!can(user.role, "report:export")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const range = parseDashboardDateRange(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );
  const projectId = url.searchParams.get("projectId") || undefined;

  const reports = await listApprovedReportsForExport({
    start: range.start,
    end: range.end,
    projectId,
  });

  let projectName = "All projects";
  if (projectId) {
    const projects = await listProjectsForExportFilter();
    projectName = projects.find((p) => p.id === projectId)?.name ?? "All projects";
  }

  const markdown = buildWeeklyReportsMarkdown({
    from: range.from,
    to: range.to,
    projectName,
    reports,
  });
  const filename = weeklyExportFilename(projectId ? projectName : undefined, range.from, range.to);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
