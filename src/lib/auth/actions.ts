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
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const validation = validateNewPassword(password, confirmPassword);

  if (!validation.ok) {
    return { error: validation.error };
  }

  // Voluntary change (already past forced flow): require current password.
  // Forced flow leaves the field empty and we skip the check, matching
  // existing behaviour on /change-password.
  const [dbUser] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
  if (!dbUser) {
    return { error: "Sesi tidak valid." };
  }

  if (!dbUser.mustChangePassword) {
    if (!currentPassword) {
      return { error: "Masukkan password saat ini." };
    }
    const currentValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!currentValid) {
      return { error: "Password saat ini salah." };
    }
    if (currentPassword === password) {
      return { error: "Password baru tidak boleh sama dengan password sekarang." };
    }
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: false, updatedAt: new Date() })
  .where(eq(users.id, currentUser.id));

  if (dbUser.mustChangePassword) {
    // Forced flow: ship the user back to the dashboard once the temporary
    // password is replaced. Voluntary change stays on the page so the user
    // sees the success state without disorienting redirects.
    redirect("/dashboard");
  }

  return { success: "Password berhasil diubah." };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
