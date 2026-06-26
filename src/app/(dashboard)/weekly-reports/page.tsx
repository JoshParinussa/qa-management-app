import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewReportDialog } from "@/components/reports/new-report-dialog";
import { WeeklyReportsDataTable } from "@/components/reports/weekly-reports-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { can, canViewWeeklyReports } from "@/lib/permissions/roles";
import { listAssignedProjects } from "@/lib/project-members/queries";
import { checkExistingWeeklyReportAction, createInitialWeeklyReportDraftAction } from "@/lib/weekly-reports/actions";
import { listAllReports, listReportsByCoAuthor } from "@/lib/weekly-reports/queries";
import { canEditReport } from "@/lib/weekly-reports/rules";
import { redirect } from "next/navigation";

export default async function WeeklyReportsPage() {
  const user = await requireUser();

  if (!canViewWeeklyReports(user.role)) {
    redirect("/dashboard");
  }

  const isReviewer = can(user.role, "report:review");
  const canCreate = can(user.role, "report:create");
  const canExport = can(user.role, "report:export");

  const [reports, assignedProjects] = await Promise.all([
    isReviewer ? listAllReports() : listReportsByCoAuthor(user.id),
    canCreate ? listAssignedProjects(user.id) : Promise.resolve([]),
  ]);
  const reportRows = reports.map((report) => ({
    ...report,
    canEdit: canEditReport(report.status),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly reports"
        description="Draft, submit, dan review weekly report QA."
        action={
          canCreate ? (
            <NewReportDialog
              projects={assignedProjects}
              checkReportConflict={checkExistingWeeklyReportAction}
              createInitialDraft={createInitialWeeklyReportDraftAction}
            />
          ) : null
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{isReviewer ? "All reports" : "My reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReportsDataTable reports={reportRows} canExport={canExport} />
        </CardContent>
      </Card>
    </div>
  );
}
