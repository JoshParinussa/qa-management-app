import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects } from "@/db/schema";

export function listProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project ?? null;
}
