import { can, canViewMonthlyReports, canViewWeeklyReports } from "@/lib/permissions/roles";
import type { Role } from "@/types";

export type PlatformItem = {
  id: "dashboard" | "projects" | "users" | "weeklyReports" | "monthlyReports";
  href: string;
  label: string;
};

const platformItems: PlatformItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard" },
  { id: "projects", href: "/projects", label: "Projects" },
  { id: "users", href: "/users", label: "Users" },
  { id: "weeklyReports", href: "/weekly-reports", label: "Weekly reports" },
  { id: "monthlyReports", href: "/monthly-reports", label: "Monthly reports" },
];

export function getVisiblePlatformItems(role: Role) {
  return platformItems.filter((item) => {
    if (item.id === "users") return can(role, "user:manage");
    if (item.id === "weeklyReports") return canViewWeeklyReports(role);
    if (item.id === "monthlyReports") return canViewMonthlyReports(role);
    return true;
  });
}
