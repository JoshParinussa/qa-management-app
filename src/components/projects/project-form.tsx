"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, ProjectStatus, WeeklyReportDisabledReason } from "@/types";

type ProjectFormValues = {
  name?: string;
  code?: string;
  description?: string | null;
  status?: ProjectStatus;
  weeklyReportRequired?: boolean;
  weeklyReportDisabledReason?: string | null;
};

type ProjectFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ProjectFormValues;
  submitLabel: string;
};

const disabledReasonOptions: { value: WeeklyReportDisabledReason; label: string }[] = [
  { value: "MAINTENANCE_ONLY", label: "Maintenance only" },
  { value: "NO_ACTIVE_QA", label: "No active QA" },
  { value: "PROJECT_PAUSED", label: "Project paused" },
  { value: "OTHER", label: "Other" },
];

export function ProjectForm({ action, defaultValues, submitLabel }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [weeklyReportRequired, setWeeklyReportRequired] = useState(defaultValues?.weeklyReportRequired ?? true);

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
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "ACTIVE"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-xs"
        >
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <section className="rounded-lg border border-border bg-slate-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <Label htmlFor="weeklyReportRequired">Weekly report required</Label>
            <p className="text-sm text-muted-foreground">
              Matikan untuk project active yang hanya maintenance dan tidak perlu masuk checklist weekly report.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
            <input
              id="weeklyReportRequired"
              type="checkbox"
              checked={weeklyReportRequired}
              onChange={(event) => setWeeklyReportRequired(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Required
          </label>
        </div>
        <input type="hidden" name="weeklyReportRequired" value={weeklyReportRequired ? "true" : "false"} />
        {!weeklyReportRequired ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="weeklyReportDisabledReason">Reason</Label>
            <select
              id="weeklyReportDisabledReason"
              name="weeklyReportDisabledReason"
              defaultValue={defaultValues?.weeklyReportDisabledReason ?? "MAINTENANCE_ONLY"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-xs"
              required
            >
              {disabledReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        ) : null}
      </section>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
