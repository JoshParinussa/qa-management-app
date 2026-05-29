import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { CreateUserForm } from "@/components/users/create-user-form";
import { userColumns } from "@/components/users/user-columns";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/users/queries";

export default async function UsersPage() {
  await requireAdmin();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Kelola user, role, dan akses." />
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>User management</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={userColumns} data={users} emptyLabel="Belum ada user." />
        </CardContent>
      </Card>
    </div>
  );
}
