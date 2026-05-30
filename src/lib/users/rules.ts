import type { Role } from "@/types";

type DeactivateCheckResult = { ok: true } | { ok: false; error: string };

export function canDeactivateUser(
  target: { role: Role; isActive: boolean },
  activeAdminCount: number,
): DeactivateCheckResult {
  if (target.role === "ADMIN" && target.isActive && activeAdminCount <= 1) {
    return { ok: false, error: "Tidak bisa menonaktifkan admin terakhir." };
  }

  return { ok: true };
}

export function buildResetPasswordUpdate(passwordHash: string) {
  return {
    passwordHash,
    mustChangePassword: true as const,
    updatedAt: new Date(),
  };
}
