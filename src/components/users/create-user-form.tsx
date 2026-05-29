"use client";

import { useActionState } from "react";
import { createUserAction } from "@/lib/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-4">
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-4">{state.error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select id="role" name="role" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue="QA_MEMBER">
          <option value="ADMIN">Admin</option>
          <option value="QA_LEAD">QA Lead</option>
          <option value="QA_MEMBER">QA Member</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Create User"}
        </Button>
      </div>
      <p className="text-sm text-slate-500 md:col-span-4">Default password: <code>password123</code>. User wajib mengganti password setelah login pertama.</p>
    </form>
  );
}
