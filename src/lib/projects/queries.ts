import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, projects } from "@/db/schema";
import { canSeeAllProjects } from "@/lib/permissions/roles";
import type { Role } from "@/types";

type ProjectViewer = {
  id: string;
  role: Role;
};

const projectColumns = {
  id: projects.id,
  name: projects.name,
  code: projects.code,
  description: projects.description,
  status: projects.status,
  startDate: projects.startDate,
  endDate: projects.endDate,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export function listProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export function listProjectsForUser(user: ProjectViewer) {
  if (canSeeAllProjects(user.role)) {
    return listProjects();
  }

  return db
    .select(projectColumns)
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, user.id), isNull(projectMembers.removedAt)))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project ?? null;
}

export async function getProjectByIdForUser(id: string, user: ProjectViewer) {
  if (canSeeAllProjects(user.role)) {
    return getProjectById(id);
  }

  const [project] = await db
    .select(projectColumns)
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(
      and(
        eq(projects.id, id),
        eq(projectMembers.userId, user.id),
        isNull(projectMembers.removedAt),
      ),
    )
    .limit(1);

  return project ?? null;
}
