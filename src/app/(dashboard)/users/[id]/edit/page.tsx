import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditUserForm } from "@/components/users/edit-user-form";
import { ResetPasswordPanel } from "@/components/users/reset-password-panel";
import { requireAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/users/queries";
import { updateUserAction, resetPasswordAction } from "@/lib/users/actions";
import type { ActionState } from "@/types";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  async function update(state: ActionState, formData: FormData) {
    "use server";
    return updateUserAction(id, state, formData);
  }

  async function reset() {
    "use server";
    return resetPasswordAction(id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit user</h2>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User detail</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserForm
            action={update}
            defaultValues={{
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordPanel action={reset} />
        </CardContent>
      </Card>
    </div>
  );
}
