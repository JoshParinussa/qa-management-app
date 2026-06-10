import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportsDataTable } from "@/components/reports/weekly-reports-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { can, canViewWeeklyReports } from "@/lib/permissions/roles";
import { listAllReports, listReportsByCoAuthor } from "@/lib/weekly-reports/queries";
import { canEditReport } from "@/lib/weekly-reports/rules";
import { redirect } from "next/navigation";

export default async function WeeklyReportsPage() {
  const user = await requireUser();

  if (!canViewWeeklyReports(user.role)) {
    redirect("/dashboard");
  }

  const isReviewer = can(user.role, "report:review");
  const reports = isReviewer ? await listAllReports() : await listReportsByCoAuthor(user.id);
  const reportRows = reports.map((report) => ({
    ...report,
    canEdit: canEditReport(report.status),
  }));
  const canCreate = can(user.role, "report:create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly reports"
        description="Draft, submit, dan review weekly report QA."
    action={
          canCreate ? (
       <Link href="/weekly-reports/new">
              <Button>New report</Button>
       </Link>
  ) : null
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{isReviewer ? "All reports" : "My reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReportsDataTable reports={reportRows} />
        </CardContent>
      </Card>
    </div>
  );
}
