import type { Role } from "@/types";

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}

export function getRoleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Admin",
    QA_LEAD: "QA Lead",
    QA_MEMBER: "QA Member",
  };

  return labels[role];
}
