"use client";

import { useActionState, useEffect, useState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { LogOut } from "lucide-react";

export function ChangePasswordPanel() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changePasswordAction, {});

  // Auto-close panel after a successful change so the user knows it landed.
  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => setOpen(false), 1500);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  return (
    <div className="space-y-3">
  <div className="flex items-start justify-between gap-3">
   <div>
   <p className="text-sm font-medium text-foreground">Password</p>
   <p className="text-xs text-muted-foreground">Ganti password akun secara berkala untuk menjaga keamanan.</p>
    </div>
        <Button type="button" variant={open ? "ghost" : "outline"} size="sm" onClick={() => setOpen((v) => !v)}>
       {open ? "Tutup" : "Ganti password"}
       </Button>
      </div>

  {open ? (
    <form action={action} className="space-y-3 rounded-lg border border-border p-4">
       {state.error ? (
   <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
   ) : null}
   {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
        ) : null}
        <div className="space-y-2">
   <Label htmlFor="currentPassword">Password saat ini</Label>
  <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
       </div>
       <div className="grid gap-3 sm:grid-cols-2">
       <div className="space-y-2">
   <Label htmlFor="password">Password baru</Label>
  <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
       </div>
       <div className="space-y-2">
   <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
   <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" minLength={8} required />
  </div>
   </div>
        <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
   <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
        Cancel
   </Button>
    <Button type="submit" size="sm" disabled={pending}>
       {pending ? "Menyimpan..." : "Simpan password baru"}
    </Button>
   </div>
   </form>
 ) : null}
    </div>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
        <LogOut className="size-4" />
     Logout
   </Button>
 </form>
  );
}
