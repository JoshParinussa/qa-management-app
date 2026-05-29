"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, ProjectStatus } from "@/types";

type ProjectFormValues = {
  name?: string;
  code?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
};

type ProjectFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ProjectFormValues;
  submitLabel: string;
};

export function ProjectForm({ action, defaultValues, submitLabel }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" defaultValue={defaultValues?.code} placeholder="UHF" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "ACTIVE"}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={defaultValues?.startDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={defaultValues?.endDate} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
