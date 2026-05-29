"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="password">Password Baru</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
      </div>
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
