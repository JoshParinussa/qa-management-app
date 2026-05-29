import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectAction } from "@/lib/projects/actions";
import { getProjectById } from "@/lib/projects/queries";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import type { ActionState } from "@/types";

function toDateInput(value: Date | null) {
  if (!value) return undefined;
  return new Date(value).toISOString().slice(0, 10);
}

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

  async function action(state: ActionState, formData: FormData) {
    "use server";
    return updateProjectAction(id, state, formData);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit project</h2>
        <p className="text-slate-500">{project.name}</p>
      </div>
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
              startDate: toDateInput(project.startDate),
              endDate: toDateInput(project.endDate),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
