"use server";

import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { userSchema } from "@/lib/validations/user";
import type { ActionState } from "@/types";

function getDefaultPassword() {
  return process.env.DEFAULT_USER_PASSWORD || "password123";
}

export async function createUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    role: formData.get("role"),
    isActive: true,
  });

  if (!parsed.success) {
    return { error: "Data user tidak valid." };
  }

  try {
    await db.insert(users).values({
      ...parsed.data,
      passwordHash: await hashPassword(getDefaultPassword()),
      mustChangePassword: true,
    });
  } catch {
    return { error: "Email sudah dipakai." };
  }

  redirect("/users");
}
