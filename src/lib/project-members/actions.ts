"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { projectMembers } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { findActiveAssignment } from "@/lib/project-members/queries";
import { buildRemoveMemberUpdate, hasActiveAssignment } from "@/lib/project-members/rules";
import { assignMemberSchema } from "@/lib/validations/project-member";
import type { ActionState } from "@/types";

async function requireProjectManager() {
  const user = await requireUser();

  if (!canManageProjects(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function assignMemberAction(projectId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireProjectManager();

  const parsed = assignMemberSchema.safeParse({
    userId: formData.get("userId"),
    assignmentRole: formData.get("assignmentRole") || "QA_MEMBER",
  });

  if (!parsed.success) {
    return { error: "Data assignment tidak valid." };
  }

  const existing = await findActiveAssignment(projectId, parsed.data.userId);

  if (hasActiveAssignment(existing)) {
    return { error: "User sudah ter-assign di project ini." };
  }

  await db.insert(projectMembers).values({
    projectId,
    userId: parsed.data.userId,
    assignmentRole: parsed.data.assignmentRole,
  });

  redirect(`/projects/${projectId}`);
}

export async function removeMemberAction(projectId: string, userId: string): Promise<ActionState> {
  await requireProjectManager();

  await db
    .update(projectMembers)
    .set(buildRemoveMemberUpdate())
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.removedAt),
      ),
    );

  redirect(`/projects/${projectId}`);
}

export async function updateMemberRoleAction(projectId: string, formData: FormData): Promise<ActionState> {
  await requireProjectManager();

  const userId = String(formData.get("userId") ?? "");
  const assignmentRole = String(formData.get("assignmentRole") ?? "");

  if (assignmentRole !== "QA_MEMBER" && assignmentRole !== "QA_PIC") {
    return { error: "Assignment role tidak valid." };
  }

  await db
    .update(projectMembers)
    .set({ assignmentRole })
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        isNull(projectMembers.removedAt),
      ),
    );

  redirect(`/projects/${projectId}`);
}
