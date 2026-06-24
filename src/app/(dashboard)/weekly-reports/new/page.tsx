import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportForm } from "@/components/reports/weekly-report-form";
import { checkExistingWeeklyReportAction, createDraftAction } from "@/lib/weekly-reports/actions";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listAssignedProjects } from "@/lib/project-members/queries";
import { isValidDateValue } from "@/lib/weekly-reports/checklist";

export default async function NewWeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; weekStartDate?: string; weekEndDate?: string }>;
}) {
  const user = await requireUser();

  if (!can(user.role, "report:create")) {
    redirect("/weekly-reports");
  }

  const params = await searchParams;
  const projects = await listAssignedProjects(user.id);
  const defaultProjectId = projects.some((project) => project.id === params.projectId) ? params.projectId : undefined;
  const defaultWeekStartDate = isValidDateValue(params.weekStartDate) ? params.weekStartDate : undefined;
  const defaultWeekEndDate = isValidDateValue(params.weekEndDate) ? params.weekEndDate : undefined;
  const defaultValues = {
    projectId: defaultProjectId,
    weekStartDate: defaultWeekStartDate,
    weekEndDate: defaultWeekEndDate,
  };
  const initialReportConflict =
    defaultProjectId && defaultWeekStartDate && defaultWeekEndDate
      ? await checkExistingWeeklyReportAction(defaultProjectId, defaultWeekStartDate, defaultWeekEndDate)
      : null;

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
          <WeeklyReportForm
            action={createDraftAction}
            checkExistingReport={checkExistingWeeklyReportAction}
            projects={projects}
            defaultValues={defaultValues}
            initialReportConflict={initialReportConflict}
            submitLabel="Save draft"
            cancelHref="/weekly-reports"
            lockProject={Boolean(defaultProjectId)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
