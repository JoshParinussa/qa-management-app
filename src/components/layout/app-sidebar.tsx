"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LogOut,
  Settings2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/session";
import { getVisiblePlatformItems, type PlatformItem } from "@/lib/navigation/items";
import { getInitials, getRoleLabel } from "@/lib/users/profile";
import { cn } from "@/lib/utils";

const platformIcons: Record<PlatformItem["id"], typeof BarChart3> = {
  dashboard: BarChart3,
  projects: FolderKanban,
  users: Users,
  weeklyReports: FileText,
  monthlyReports: CalendarDays,
};

const secondaryItems = [
  { href: "/profile", label: "Profile settings", icon: Settings2 },
];

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const platformItems = getVisiblePlatformItems(user.role);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("qa-sidebar-collapsed") === "true";
  });

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("qa-sidebar-collapsed", String(next));
  }

  useEffect(() => {
    window.addEventListener("qa-sidebar-toggle", toggleCollapsed);
    return () => window.removeEventListener("qa-sidebar-toggle", toggleCollapsed);
  });

  return (
    <aside className={cn("hidden border-r border-slate-200 bg-slate-50/60 text-slate-950 transition-[width] duration-200 lg:block", collapsed ? "w-14" : "w-64")}>
      <div className="sticky top-0 flex h-screen flex-col p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <FolderKanban className="size-4" />
          </div>
          <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
            <p className="truncate text-sm font-medium leading-none">QA Management</p>
            <p className="truncate text-xs text-slate-500">Digitech</p>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <p className={cn("px-2 pb-1 text-xs font-medium text-slate-500", collapsed && "sr-only")}>Platform</p>
          {platformItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = platformIcons[item.id];

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-slate-100",
                  active && "border-l-4 border-slate-950 bg-slate-100 font-semibold pl-1.5",
                  collapsed && "justify-center",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-slate-950")} />
                <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 space-y-1">
          <p className={cn("px-2 pb-1 text-xs font-medium text-slate-500", collapsed && "sr-only")}>Account</p>
          {secondaryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn("flex h-9 items-center gap-2 rounded-md px-2 text-sm text-slate-700 transition-colors hover:bg-slate-100", collapsed && "justify-center")}
            >
              <item.icon className="size-4 shrink-0" />
              <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto space-y-1">
          <details className="group relative">
            <summary className={cn("flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-100 [&::-webkit-details-marker]:hidden", collapsed && "justify-center")}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">{getInitials(user.name)}</span>
              <span className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
                <span className="block truncate text-sm font-medium leading-none">{user.name}</span>
                <span className="block truncate text-xs text-slate-500">{getRoleLabel(user.role)}</span>
              </span>
            </summary>
            <div className="absolute bottom-12 left-2 z-20 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Profile</Link>
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" type="submit">
                  <LogOut className="size-4" />
                  Logout
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}
