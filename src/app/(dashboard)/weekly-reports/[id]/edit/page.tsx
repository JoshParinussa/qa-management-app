import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportForm } from "@/components/reports/weekly-report-form";
import { updateDraftAction } from "@/lib/weekly-reports/actions";
import { requireUser } from "@/lib/auth/session";
import { getReportById, isCoAuthor } from "@/lib/weekly-reports/queries";
import { canEditReport } from "@/lib/weekly-reports/rules";
import { listAssignedProjects } from "@/lib/project-members/queries";
import type { WeeklyReportActionState } from "@/lib/weekly-reports/form-state";

function toDateInput(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function EditWeeklyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const userIsCoAuthor = await isCoAuthor(id, user.id);
  if (!userIsCoAuthor) {
    notFound();
  }

  if (!canEditReport(report.status)) {
    redirect(`/weekly-reports/${id}`);
  }

  const projects = await listAssignedProjects(user.id);

  async function action(state: WeeklyReportActionState, formData: FormData) {
    "use server";
    return updateDraftAction(id, state, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit weekly report</h2>
        <p className="text-muted-foreground">Perbarui draft report kamu.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report detail</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReportForm
      action={action}
            projects={projects}
   submitLabel="Save changes"
cancelHref={`/weekly-reports/${id}`}
     lockProject
  defaultValues={{
              projectId: report.projectId,
              weekStartDate: toDateInput(report.weekStartDate),
              weekEndDate: toDateInput(report.weekEndDate),
              summary: report.summary,
              productionIncidentCount: report.productionIncidentCount,
              productionIncidentNotes: report.productionIncidentNotes,
              bugDocumentUrl: report.bugDocumentUrl,
              testCaseTotal: report.testCaseTotal,
              testCaseBeTotal: report.testCaseBeTotal,
              testCaseFeTotal: report.testCaseFeTotal,
              automationBeTotal: report.automationBeTotal,
              automationFeTotal: report.automationFeTotal,
              automationBePassed: report.automationBePassed,
              automationBeFailed: report.automationBeFailed,
              automationFePassed: report.automationFePassed,
              automationFeFailed: report.automationFeFailed,
              automationPassed: report.automationPassed,
              automationFailed: report.automationFailed,
              blocker: report.blocker,
              nextWeekPlan: report.nextWeekPlan,
              notes: report.notes,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
