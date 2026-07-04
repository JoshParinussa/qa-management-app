"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { generateRandomPassword, hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { countActiveAdmins, getUserById } from "@/lib/users/queries";
import { buildResetPasswordUpdate, canDeactivateUser } from "@/lib/users/rules";
import { userSchema } from "@/lib/validations/user";
import { mapDbError } from "@/lib/action-result";
import { getDefaultPassword } from "@/lib/users/defaults";
import { reconcileReportsAfterUserDeactivation } from "@/lib/weekly-reports/approval-workflow";
import type { ActionState } from "@/types";

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
  } catch (error) {
    return { error: mapDbError(error, "Email sudah dipakai.") };
  }

  redirect("/users");
}

export async function updateUserAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const target = await getUserById(id);

  if (!target) {
    return { error: "User tidak ditemukan." };
  }

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { error: "Data user tidak valid." };
  }

  try {
    await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, id));
  } catch (error) {
    return { error: mapDbError(error, "Email sudah dipakai.") };
  }

  if (target.isActive && !parsed.data.isActive) {
    await reconcileReportsAfterUserDeactivation(id, admin.id);
  }

  redirect(`/users`);
}

export async function deactivateUserAction(id: string): Promise<ActionState> {
  const admin = await requireAdmin();

  const target = await getUserById(id);

  if (!target) {
    return { error: "User tidak ditemukan." };
  }

  const activeAdmins = await countActiveAdmins();
  const check = canDeactivateUser(target, activeAdmins);
  if (!check.ok) {
    return { error: check.error };
  }

  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, id));
  if (target.isActive) {
    await reconcileReportsAfterUserDeactivation(id, admin.id);
  }

  redirect("/users");
}

export async function resetPasswordAction(id: string): Promise<ActionState> {
  await requireAdmin();

  const target = await getUserById(id);

  if (!target) {
    return { error: "User tidak ditemukan." };
  }

  const newPassword = generateRandomPassword();
  const update = buildResetPasswordUpdate(await hashPassword(newPassword));

  await db.update(users).set(update).where(eq(users.id, id));

  return { success: newPassword };
}
