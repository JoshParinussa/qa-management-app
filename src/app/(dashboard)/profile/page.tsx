import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getInitials, getRoleLabel } from "@/lib/users/profile";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-slate-500">Informasi akun yang sedang login.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-lg font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-1 font-medium">{getRoleLabel(user.role)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Password Status</p>
              <p className="mt-1 font-medium">{user.mustChangePassword ? "Need Change" : "Active"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
