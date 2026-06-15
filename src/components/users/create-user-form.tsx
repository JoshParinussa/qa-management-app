"use client";

import { useActionState } from "react";
import { createUserAction } from "@/lib/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateUserForm({ defaultPassword }: { defaultPassword: string }) {
  const [state, action, pending] = useActionState(createUserAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create new user</CardTitle>
        <CardDescription>
          Tambahkan user baru ke sistem. User akan menerima password default dan wajib menggantinya saat login pertama.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {state.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama lengkap
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                aria-describedby="name-hint"
              />
              <p id="name-hint" className="text-xs text-slate-500">
                Nama akan ditampilkan di seluruh aplikasi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                aria-describedby="email-hint"
              />
              <p id="email-hint" className="text-xs text-slate-500">
                Email digunakan untuk login
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              Role
            </Label>
            <select
              id="role"
              name="role"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              defaultValue="QA_MEMBER"
              aria-describedby="role-hint"
            >
              <option value="ADMIN">Admin - Akses penuh ke semua fitur</option>
              <option value="QA_LEAD">QA Lead - Kelola project dan review report</option>
              <option value="QA_MEMBER">QA Member - Buat weekly report</option>
            </select>
            <p id="role-hint" className="text-xs text-slate-500">
              Role menentukan permission dan fitur yang bisa diakses user
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex gap-3">
              <div className="text-amber-600">⚠️</div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-900">Default password</p>
                <p className="mt-1 text-amber-700">
                  User akan login dengan password: <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs font-semibold">{defaultPassword}</code>
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  User wajib mengganti password ini saat login pertama kali.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="min-w-[140px]" type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Create User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
