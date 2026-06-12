import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { ChangePasswordPanel, LogoutButton } from "@/components/profile/account-actions";
import { requireUser } from "@/lib/auth/session";
import { getInitials, getRoleLabel } from "@/lib/users/profile";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
 <PageHeader title="Profile" description="Informasi akun yang sedang login." />

      <Card>
        <CardContent className="pt-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
     <div className="grid size-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
   {getInitials(user.name)}
         </div>
       <div className="min-w-0 flex-1">
       <h2 className="truncate text-xl font-semibold text-foreground">{user.name}</h2>
       <p className="truncate text-sm text-muted-foreground">{user.email}</p>
       <div className="mt-2 inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
{getRoleLabel(user.role)}
   </div>
       </div>
       </div>
        </CardContent>
      </Card>

      <Card>
   <CardHeader>
   <CardTitle>Akun</CardTitle>
   </CardHeader>
   <CardContent className="space-y-5">
     <ChangePasswordPanel />
  <Separator />
       <div className="flex items-start justify-between gap-3">
   <div>
   <p className="text-sm font-medium text-foreground">Sign out</p>
       <p className="text-xs text-muted-foreground">Keluar dari sesi browser saat ini.</p>
  </div>
   <LogoutButton />
       </div>
        </CardContent>
   </Card>
    </div>
  );
}
