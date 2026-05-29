"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword, hashPassword } from "./password";
import { createSession, destroySession, requireUser } from "./session";
import { getPostLoginRedirect, validateNewPassword } from "./flow";
import type { ActionState } from "@/types";

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.isActive) {
    return { error: "Email atau password salah." };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    return { error: "Email atau password salah." };
  }

  await createSession(user.id);
  redirect(getPostLoginRedirect({ mustChangePassword: user.mustChangePassword }));
}

export async function changePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const currentUser = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const validation = validateNewPassword(password, confirmPassword);

  if (!validation.ok) {
    return { error: validation.error };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, currentUser.id));

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
