"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types";

type AssignableUser = {
  id: string;
  name: string;
  email: string;
};

type ProjectMemberFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  users: AssignableUser[];
};

export function ProjectMemberForm({ action, users }: ProjectMemberFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:w-full">{state.error}</p> : null}
      <div className="flex-1 space-y-2">
        <Label htmlFor="userId">User</Label>
        <select
          id="userId"
          name="userId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Pilih user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignmentRole">Role</Label>
        <select
          id="assignmentRole"
          name="assignmentRole"
          defaultValue="QA_MEMBER"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="QA_MEMBER">QA Member</option>
          <option value="QA_PIC">QA PIC</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Assigning..." : "Assign"}
      </Button>
    </form>
  );
}
