import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectsDataTable } from "@/components/projects/projects-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { listProjects } from "@/lib/projects/queries";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjects();
  const canManage = canManageProjects(user.role);

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
          <ProjectsDataTable projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
