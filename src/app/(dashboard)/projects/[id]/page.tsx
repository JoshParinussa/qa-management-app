import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveProjectAction } from "@/lib/projects/actions";
import { getProjectById } from "@/lib/projects/queries";
import { assignMemberAction, removeMemberAction } from "@/lib/project-members/actions";
import { listAssignableUsers, listProjectMembers } from "@/lib/project-members/queries";
import { ProjectMemberForm } from "@/components/projects/project-member-form";
import { ProjectMemberTable } from "@/components/projects/project-member-table";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import type { ActionState } from "@/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const canManage = canManageProjects(user.role);
  const members = await listProjectMembers(id);
  const assignableUsers = canManage ? await listAssignableUsers() : [];

  async function archive() {
    "use server";
    await archiveProjectAction(id);
  }

  async function assign(state: ActionState, formData: FormData) {
    "use server";
    return assignMemberAction(id, state, formData);
  }

  async function remove(formData: FormData) {
    "use server";
    await removeMemberAction(id, String(formData.get("userId")));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-slate-500">Code: {project.code}</p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            {project.status === "ACTIVE" ? (
              <form action={archive}>
                <Button variant="outline" type="submit">Archive</Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={project.status === "ACTIVE" ? "secondary" : "outline"}>
              {project.status === "ACTIVE" ? "Active" : "Archived"}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">{project.description ?? "Tidak ada deskripsi."}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assigned members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage ? <ProjectMemberForm action={assign} users={assignableUsers} /> : null}
          <ProjectMemberTable members={members} canManage={canManage} removeAction={remove} />
        </CardContent>
      </Card>
    </div>
  );
}
