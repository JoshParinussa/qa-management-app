import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MonthlyFilter } from "@/components/monthly-reports/monthly-filter";
import { MonthlySummaryView } from "@/components/monthly-reports/monthly-summary";
import { ExportButton } from "@/components/monthly-reports/export-button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { getMonthlySummary, listActiveProjectsForFilter } from "@/lib/monthly-reports/queries";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MonthlyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; projectId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month || currentMonth();
  const projectId = params.projectId || undefined;

  const projects = await listActiveProjectsForFilter();
  const summary = await getMonthlySummary({ month, projectId });
  const canExport = can(user.role, "report:export");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly reports"
        description="Summary bulanan dari weekly report berstatus approved."
        action={canExport ? <ExportButton month={month} projectId={projectId} /> : null}
      />
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyFilter projects={projects} month={month} projectId={projectId} />
        </CardContent>
      </Card>
      <MonthlySummaryView summary={summary} />
    </div>
  );
}
