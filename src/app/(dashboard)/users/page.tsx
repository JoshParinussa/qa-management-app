import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersDataTable } from "@/components/users/users-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { CreateUserForm } from "@/components/users/create-user-form";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/users/queries";
import { getDefaultPassword } from "@/lib/users/defaults";

export default async function UsersPage() {
  await requireAdmin();
  const users = await listUsers();
  const defaultPassword = getDefaultPassword();

  return (
  <div className="space-y-6">
      <PageHeader title="Users" description="Kelola user, role, dan akses." />
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
   <CardContent>
       <CreateUserForm defaultPassword={defaultPassword} />
   </CardContent>
   </Card>
      <Card>
        <CardHeader>
     <CardTitle>User management</CardTitle>
    </CardHeader>
     <CardContent>
          <UsersDataTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
