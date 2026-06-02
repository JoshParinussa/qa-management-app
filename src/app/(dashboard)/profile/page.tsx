import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { getInitials, getRoleLabel } from "@/lib/users/profile";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" description="Informasi akun yang sedang login." />
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="mt-1 font-medium">{getRoleLabel(user.role)}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Password status</p>
              <p className="mt-1 font-medium">{user.mustChangePassword ? "Need change" : "Active"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
