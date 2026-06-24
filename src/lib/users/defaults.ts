/**
 * Server-only helpers for user defaults.
 * Kept separate from `actions.ts` because that file is annotated with
 * `"use server"` (every export must be an async server action).
 */
import "server-only";

export function getDefaultPassword(): string {
  const password = process.env.DEFAULT_USER_PASSWORD?.trim();
  if (!password) {
    throw new Error("DEFAULT_USER_PASSWORD is required");
  }
  return password;
}
