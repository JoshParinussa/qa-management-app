import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listReportsForExportByIds } from "@/lib/weekly-reports/queries";
import {
  buildWeeklyReportsMarkdown,
  weeklyExportFilename,
} from "@/lib/weekly-reports/export-markdown";

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type ExportRequestBody = {
  ids?: unknown;
  projectLabel?: unknown;
  statusLabel?: unknown;
  periodLabel?: unknown;
};

export async function POST(request: Request) {
  const user = await requireUser();

  if (!can(user.role, "report:export")) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: ExportRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id))
    : [];
  const projectLabel = typeof body.projectLabel === "string" && body.projectLabel.trim() ? body.projectLabel.trim() : "All projects";
  const statusLabel = typeof body.statusLabel === "string" && body.statusLabel.trim() ? body.statusLabel.trim() : "All status";
  const periodLabel = typeof body.periodLabel === "string" && body.periodLabel.trim() ? body.periodLabel.trim() : undefined;

  const reports = ids.length > 0 ? await listReportsForExportByIds(ids) : [];

  const markdown = buildWeeklyReportsMarkdown({ projectLabel, statusLabel, periodLabel, reports });
  const filename = weeklyExportFilename(projectLabel, statusLabel);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
