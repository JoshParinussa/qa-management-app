import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectAction } from "@/lib/projects/actions";
import { getProjectById } from "@/lib/projects/queries";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { PageHeader } from "@/components/layout/page-header";
import type { ActionState } from "@/types";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  if (!canManageProjects(user.role)) {
    redirect("/projects");
  }

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  if (project.status === "ARCHIVED") {
    redirect(`/projects/${id}`);
  }

  async function action(state: ActionState, formData: FormData) {
    "use server";
    return updateProjectAction(id, state, formData);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit project" description={project.name} />
      <Card>
        <CardHeader>
          <CardTitle>Project detail</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={action}
            submitLabel="Save changes"
            defaultValues={{
              name: project.name,
              code: project.code,
              description: project.description,
              status: project.status,
              weeklyReportRequired: project.weeklyReportRequired,
              weeklyReportDisabledReason: project.weeklyReportDisabledReason,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
