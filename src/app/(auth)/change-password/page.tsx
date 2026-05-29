import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat Password Baru</CardTitle>
          <p className="text-sm text-slate-500">Password default hanya bisa dipakai untuk login pertama.</p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
