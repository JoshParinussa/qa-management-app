import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportsDataTable } from "@/components/reports/weekly-reports-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listAllReports, listReportsByUser } from "@/lib/weekly-reports/queries";

export default async function WeeklyReportsPage() {
  const user = await requireUser();
  const isReviewer = can(user.role, "report:review");
  const reports = isReviewer ? await listAllReports() : await listReportsByUser(user.id);
  const canCreate = can(user.role, "report:create");
  const isAdmin = user.role === "ADMIN";

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
      {isAdmin ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Admin tidak membuat weekly report. Login sebagai QA Lead atau QA Member untuk membuat report.
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{isReviewer ? "All reports" : "My reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReportsDataTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
