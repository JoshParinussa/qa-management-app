"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { canManageProjects } from "@/lib/permissions/roles";
import { projectSchema } from "@/lib/validations/project";
import type { ActionState } from "@/types";

async function requireProjectManager() {
  const user = await requireUser();

  if (!canManageProjects(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    code: String(formData.get("code") ?? "").toUpperCase(),
    description: String(formData.get("description") ?? "") || undefined,
    status: formData.get("status") || "ACTIVE",
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });
}

export async function createProjectAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireProjectManager();

  const parsed = parseProjectForm(formData);

  if (!parsed.success) {
    return { error: "Data project tidak valid." };
  }

  try {
    await db.insert(projects).values(parsed.data);
  } catch {
    return { error: "Kode project sudah dipakai." };
  }

  redirect("/projects");
}

export async function updateProjectAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireProjectManager();

  const parsed = parseProjectForm(formData);

  if (!parsed.success) {
    return { error: "Data project tidak valid." };
  }

  try {
    await db
      .update(projects)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projects.id, id));
  } catch {
    return { error: "Kode project sudah dipakai." };
  }

  redirect(`/projects/${id}`);
}

export async function archiveProjectAction(id: string) {
  await requireProjectManager();

  await db
    .update(projects)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(projects.id, id));

  redirect("/projects");
}
