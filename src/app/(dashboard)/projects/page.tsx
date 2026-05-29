import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectTable } from "@/components/projects/project-table";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { listProjects } from "@/lib/projects/queries";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjects();
  const canManage = canManageProjects(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-slate-500">Kelola project QA yang aktif.</p>
        </div>
        {canManage ? (
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectTable projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
