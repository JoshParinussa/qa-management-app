"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

type Props = {
  mode: "approve" | "revoke";
  action: () => Promise<ActionState | void>;
};

const labels = {
  approve: { idle: "Approve", pending: "Menyimpan..." },
  revoke: { idle: "Batalkan approval", pending: "Membatalkan..." },
} as const;

export function QaApprovalButton({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(async () => {
    const result = await action();
    return result ?? {};
  }, {} as ActionState);

  const label = pending ? labels[mode].pending : labels[mode].idle;
  const variant = mode === "approve" ? "default" : "outline";

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} variant={variant} className="w-fit">
        {label}
      </Button>
    </form>
  );
}

export function SubmitToReviewerButton({ action }: { action: () => Promise<ActionState | void> }) {
  const [state, formAction, pending] = useActionState(async () => {
    const result = await action();
    return result ?? {};
  }, {} as ActionState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Mengajukan..." : "Ajukan untuk approval QA"}
      </Button>
    </form>
  );
}
