import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export function listUsers() {
  return db.select().from(users).orderBy(asc(users.createdAt));
}
