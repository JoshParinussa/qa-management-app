import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listReportsForExportByIds } from "@/lib/weekly-reports/queries";
import {
  buildWeeklyReportsExportData,
  weeklyExportFilename,
  type ExportFormat,
} from "@/lib/weekly-reports/export-data";
import { renderWeeklyReportsPdf } from "@/lib/weekly-reports/export-pdf";
import { renderWeeklyReportsDocx } from "@/lib/weekly-reports/export-docx";

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const CONTENT_TYPE: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

type ExportRequestBody = {
  ids?: unknown;
  projectLabel?: unknown;
  statusLabel?: unknown;
  periodLabel?: unknown;
  format?: unknown;
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
  const format: ExportFormat = body.format === "docx" ? "docx" : "pdf";

  const reports = ids.length > 0 ? await listReportsForExportByIds(ids) : [];

  const data = buildWeeklyReportsExportData({ projectLabel, statusLabel, periodLabel, reports });
  const buffer = format === "docx" ? await renderWeeklyReportsDocx(data) : await renderWeeklyReportsPdf(data);
  const filename = weeklyExportFilename(projectLabel, statusLabel, format);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPE[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
