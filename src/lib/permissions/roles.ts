import type { Role } from "@/types";

export type PermissionAction =
  | "project:read"
  | "project:manage"
  | "user:manage"
  | "report:create"
  | "report:review"
  | "dashboard:all"
  | "report:export";

const permissions: Record<Role, PermissionAction[]> = {
  ADMIN: ["project:read", "project:manage", "user:manage", "dashboard:all", "report:export"],
  QA_LEAD: [
    "project:read",
    "project:manage",
    "report:create",
    "report:review",
    "dashboard:all",
    "report:export",
  ],
  QA_MEMBER: ["project:read", "report:create"],
};

export function can(role: Role, action: PermissionAction) {
  return permissions[role].includes(action);
}

export function canManageProjects(role: Role) {
  return can(role, "project:manage");
}

export function canSeeAllProjects(role: Role) {
  return canManageProjects(role);
}

export function canViewWeeklyReports(role: Role) {
  return can(role, "report:create") || can(role, "report:review");
}

export function canViewMonthlyReports(role: Role) {
  return can(role, "report:export");
}
