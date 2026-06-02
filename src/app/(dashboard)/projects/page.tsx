import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectsDataTable } from "@/components/projects/projects-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { archiveProjectAction, restoreProjectAction } from "@/lib/projects/actions";
import { listProjectsForUser } from "@/lib/projects/queries";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjectsForUser(user);
  const canManage = canManageProjects(user.role);

  async function archive(formData: FormData) {
    "use server";
    const projectId = String(formData.get("projectId") ?? "");
    await archiveProjectAction(projectId);
  }

  async function restore(formData: FormData) {
    "use server";
    const projectId = String(formData.get("projectId") ?? "");
    await restoreProjectAction(projectId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Kelola project QA yang aktif."
        action={
          canManage ? (
            <Link href="/projects/new">
              <Button>New project</Button>
            </Link>
          ) : null
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectsDataTable projects={projects} canManage={canManage} archiveAction={archive} restoreAction={restore} />
        </CardContent>
      </Card>
    </div>
  );
}
