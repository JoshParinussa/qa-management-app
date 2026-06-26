import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listReportsForExportByIds } from "@/lib/weekly-reports/queries";
import { buildWeeklyReportsExportData, weeklyExportFilename } from "@/lib/weekly-reports/export-data";
import { renderWeeklyReportsPdf } from "@/lib/weekly-reports/export-pdf";

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

  const data = buildWeeklyReportsExportData({ projectLabel, statusLabel, periodLabel, reports });
  const buffer = await renderWeeklyReportsPdf(data);
  const filename = weeklyExportFilename(projectLabel, statusLabel);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
