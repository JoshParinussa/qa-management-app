import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import {
  getMonthlySummary,
  listActiveProjectsForFilter,
} from "@/lib/monthly-reports/queries";
import { buildMonthlyMarkdown, monthlyExportFilename } from "@/lib/monthly-reports/export-markdown";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export async function GET(request: Request) {
  const user = await requireUser();

  if (!can(user.role, "report:export")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month") || currentMonth();
  const projectId = url.searchParams.get("projectId") || undefined;

  const summary = await getMonthlySummary({ month, projectId });

  let projectName = "All projects";
  if (projectId) {
    const projects = await listActiveProjectsForFilter();
    projectName = projects.find((p) => p.id === projectId)?.name ?? "All projects";
  }

  const markdown = buildMonthlyMarkdown({ projectName, month, summary });
  const filename = monthlyExportFilename(projectId ? projectName : undefined, month);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
