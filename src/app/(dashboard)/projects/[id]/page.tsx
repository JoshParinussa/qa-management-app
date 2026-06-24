import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveProjectAction, restoreProjectAction } from "@/lib/projects/actions";
import { getProjectByIdForUser } from "@/lib/projects/queries";
import { assignMemberAction, removeMemberAction, updateMemberRoleAction } from "@/lib/project-members/actions";
import { listAssignableUsers, listProjectMembers } from "@/lib/project-members/queries";
import { ProjectMemberForm } from "@/components/projects/project-member-form";
import { ProjectMemberDataTable } from "@/components/projects/project-member-data-table";
import { ProjectReportingBadge } from "@/components/projects/project-reporting-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import type { ActionState } from "@/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProjectByIdForUser(id, user);

  if (!project) {
    notFound();
  }

  const canManage = canManageProjects(user.role);
  const isArchived = project.status === "ARCHIVED";
  const canEditProject = canManage && !isArchived;
  const members = await listProjectMembers(id);
  const assignableUsers = canEditProject ? await listAssignableUsers() : [];

  async function archive() {
    "use server";
    await archiveProjectAction(id);
  }

  async function restore() {
    "use server";
    await restoreProjectAction(id);
  }

  async function assign(state: ActionState, formData: FormData) {
    "use server";
    return assignMemberAction(id, state, formData);
  }

  async function remove(formData: FormData) {
    "use server";
    await removeMemberAction(id, String(formData.get("userId")));
  }

  async function updateRole(formData: FormData) {
    "use server";
    await updateMemberRoleAction(id, formData);
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
            {canEditProject ? (
              <Link href={`/projects/${id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
            ) : null}
            {!isArchived ? (
              <form action={archive}>
                <Button variant="outline" type="submit">Archive</Button>
              </form>
            ) : null}
            {isArchived ? (
              <form action={restore}>
                <Button variant="outline" type="submit">Restore active</Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
      {isArchived ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Project ini archived. Edit project, assign member, ubah role member, dan remove member dinonaktifkan sampai project di-restore menjadi active.
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Project information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <ProjectReportingBadge
              required={project.weeklyReportRequired}
              reason={project.weeklyReportDisabledReason}
            />
          </div>
          <p className="text-sm text-slate-600">{project.description ?? "Tidak ada deskripsi."}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assigned members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canEditProject ? <ProjectMemberForm action={assign} users={assignableUsers} /> : null}
          <ProjectMemberDataTable members={members} canManage={canEditProject} removeAction={remove} updateRoleAction={updateRole} />
        </CardContent>
      </Card>
    </div>
  );
}
