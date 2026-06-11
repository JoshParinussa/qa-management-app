/**
 * Server-only helpers for user defaults.
 * Kept separate from `actions.ts` because that file is annotated with
 * `"use server"` (every export must be an async server action).
 */
import "server-only";

export function getDefaultPassword(): string {
  return process.env.DEFAULT_USER_PASSWORD || "password123";
}
