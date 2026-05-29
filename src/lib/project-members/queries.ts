import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers, projects, users } from "@/db/schema";

export function listProjectMembers(projectId: string) {
  return db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      name: users.name,
      email: users.email,
      assignmentRole: projectMembers.assignmentRole,
      assignedAt: projectMembers.assignedAt,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(and(eq(projectMembers.projectId, projectId), isNull(projectMembers.removedAt)));
}

export async function findActiveAssignment(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.removedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export function listAssignableUsers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.isActive, true));
}

export function listAssignedProjects(userId: string) {
  return db
    .select({ id: projects.id, name: projects.name })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(
      and(
        eq(projectMembers.userId, userId),
        isNull(projectMembers.removedAt),
        eq(projects.status, "ACTIVE"),
      ),
    );
}
