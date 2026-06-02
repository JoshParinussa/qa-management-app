import { and, eq } from "drizzle-orm";
import { db, pool } from "./client";
import { hashPassword } from "@/lib/auth/password";
import { projectMembers, projects, users } from "./schema";

async function upsertUser(input: typeof users.$inferInsert) {
  const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) {
    const [updated] = await db.update(users).set(input).where(eq(users.id, existing.id)).returning();
    return updated;
  }

  const [created] = await db.insert(users).values(input).returning();
  return created;
}

async function upsertProject(input: typeof projects.$inferInsert) {
  const [existing] = await db.select().from(projects).where(eq(projects.code, input.code)).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(projects).values(input).returning();
  return created;
}

async function upsertProjectMember(input: typeof projectMembers.$inferInsert) {
  const [existing] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, input.projectId), eq(projectMembers.userId, input.userId)))
    .limit(1);

  if (existing) return existing;

  const [created] = await db.insert(projectMembers).values(input).onConflictDoNothing().returning();
  return created;
}

async function main() {
  const passwordHash = await hashPassword("password123");

  await upsertUser({ name: "Jopa", email: "jopa@example.com", role: "ADMIN", passwordHash, mustChangePassword: true });
  const lead = await upsertUser({ name: "QA Lead", email: "lead@example.com", role: "QA_LEAD", passwordHash, mustChangePassword: true });
  const qa1 = await upsertUser({ name: "QA Member 1", email: "qa1@example.com", role: "QA_MEMBER", passwordHash, mustChangePassword: true });
  const qa2 = await upsertUser({ name: "QA Member 2", email: "qa2@example.com", role: "QA_MEMBER", passwordHash, mustChangePassword: true });

  const uhf = await upsertProject({ name: "UHealth Frontend", code: "UHF", description: "Frontend QA coverage" });
  const uhb = await upsertProject({ name: "UHealth Backend", code: "UHB", description: "Backend QA coverage" });
  const autopipe = await upsertProject({ name: "Automation Pipeline", code: "AUTOPIPE", description: "Automation pipeline coverage" });

  await upsertProjectMember({ projectId: uhf.id, userId: lead.id, assignmentRole: "QA_PIC" });
  await upsertProjectMember({ projectId: uhb.id, userId: lead.id, assignmentRole: "QA_PIC" });
  await upsertProjectMember({ projectId: autopipe.id, userId: lead.id, assignmentRole: "QA_PIC" });
  await upsertProjectMember({ projectId: uhf.id, userId: qa1.id });
  await upsertProjectMember({ projectId: uhb.id, userId: qa2.id });
}

main()
  .finally(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
