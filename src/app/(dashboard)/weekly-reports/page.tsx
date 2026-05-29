import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { weeklyReportColumns } from "@/components/reports/weekly-report-columns";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listAllReports, listReportsByUser } from "@/lib/weekly-reports/queries";

export default async function WeeklyReportsPage() {
  const user = await requireUser();
  const isReviewer = can(user.role, "report:review");
  const reports = isReviewer ? await listAllReports() : await listReportsByUser(user.id);
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
          <DataTable columns={weeklyReportColumns} data={reports} emptyLabel="Belum ada report." />
        </CardContent>
      </Card>
    </div>
  );
}
