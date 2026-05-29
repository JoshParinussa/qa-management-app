"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

export function SubmitReportButton({ action }: { action: () => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(async () => action(), {});

  return (
    <form action={formAction} className="space-y-2">
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
