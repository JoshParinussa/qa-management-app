import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportForm } from "@/components/reports/weekly-report-form";
import { createDraftAction } from "@/lib/weekly-reports/actions";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listAssignedProjects } from "@/lib/project-members/queries";

export default async function NewWeeklyReportPage() {
  const user = await requireUser();

  if (!can(user.role, "report:create")) {
    redirect("/weekly-reports");
  }

  const projects = await listAssignedProjects(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New weekly report</h2>
        <p className="text-muted-foreground">Isi draft report untuk project yang kamu pegang.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report detail</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReportForm action={createDraftAction} projects={projects} submitLabel="Save draft" cancelHref="/weekly-reports" />
        </CardContent>
      </Card>
    </div>
  );
}
