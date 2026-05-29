import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveProjectAction } from "@/lib/projects/actions";
import { getProjectById } from "@/lib/projects/queries";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const canManage = canManageProjects(user.role);

  async function archive() {
    "use server";
    await archiveProjectAction(id);
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
    </div>
  );
}
