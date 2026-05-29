import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectAction } from "@/lib/projects/actions";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { redirect } from "next/navigation";

export default async function NewProjectPage() {
  const user = await requireUser();

  if (!canManageProjects(user.role)) {
    redirect("/projects");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New project</h2>
        <p className="text-slate-500">Buat project QA baru.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project detail</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm action={createProjectAction} submitLabel="Create project" />
        </CardContent>
      </Card>
    </div>
  );
}
