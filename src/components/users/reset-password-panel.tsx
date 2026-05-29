"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

export function ResetPasswordPanel({ action }: { action: () => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(async () => action(), {});

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Generate password baru. Password lama langsung tidak berlaku dan user wajib ganti password saat login berikutnya.
      </p>
      {state.success ? (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Password baru (tampil sekali, salin sekarang):</p>
          <code className="mt-1 block break-all text-sm font-semibold">{state.success}</code>
        </div>
      ) : null}
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Generating..." : "Reset password"}
      </Button>
    </form>
  );
}
