import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export function listUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function countActiveAdmins() {
  const rows = await db.select().from(users).where(eq(users.role, "ADMIN"));
  return rows.filter((u) => u.isActive).length;
}
