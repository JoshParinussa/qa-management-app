import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <div className="min-h-screen bg-white lg:flex">
      <AppSidebar user={user} />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
