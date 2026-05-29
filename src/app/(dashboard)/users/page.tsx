import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserForm } from "@/components/users/create-user-form";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/users/queries";

export default async function UsersPage() {
  await requireAdmin();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Need Password Change</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{user.name}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.role}</td>
                    <td className="py-3">{user.mustChangePassword ? "Yes" : "No"}</td>
                    <td className="py-3">{user.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
