import type { ActionState } from "@/types";

export function actionError(message: string): ActionState {
  return { error: message };
}

export function actionSuccess(message: string): ActionState {
  return { success: message };
}

export function mapDbError(error: unknown, uniqueMessage: string): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      return uniqueMessage;
    }
  }

  return "Terjadi kesalahan. Coba lagi.";
}
