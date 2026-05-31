"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BulletListInput } from "@/components/ui/bullet-list-input";
import { IncidentListInput } from "@/components/ui/incident-list-input";
import type { ActionState } from "@/types";

type ProjectOption = { id: string; name: string };

export type WeeklyReportDefaults = {
  projectId?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  summary?: string;
  productionIncidentCount?: number;
  productionIncidentNotes?: string | null;
  bugDocumentUrl?: string | null;
  testCaseBeTotal?: number;
  testCaseBeExecuted?: number;
  testCaseFeTotal?: number;
  testCaseFeExecuted?: number;
  automationBeTotal?: number;
  automationFeTotal?: number;
  automationPassed?: number;
  automationFailed?: number;
  blocker?: string | null;
  nextWeekPlan?: string;
  notes?: string | null;
};

type WeeklyReportFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  projects: ProjectOption[];
  defaultValues?: WeeklyReportDefaults;
  submitLabel: string;
  lockProject?: boolean;
};

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} defaultValue={defaultValue ?? 0} />
    </div>
  );
}

export function WeeklyReportForm({ action, projects, defaultValues, submitLabel, lockProject }: WeeklyReportFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="projectId">Project</Label>
          <select
            id="projectId"
            name="projectId"
            defaultValue={defaultValues?.projectId ?? ""}
            disabled={lockProject}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
          >
            <option value="">Pilih project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          {lockProject ? <input type="hidden" name="projectId" value={defaultValues?.projectId} /> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekStartDate">Week start</Label>
          <Input id="weekStartDate" name="weekStartDate" type="date" defaultValue={defaultValues?.weekStartDate} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekEndDate">Week end</Label>
          <Input id="weekEndDate" name="weekEndDate" type="date" defaultValue={defaultValues?.weekEndDate} required />
        </div>
      </section>

      <BulletListInput
        name="summary"
        label="Summary"
        defaultValue={defaultValues?.summary}
        placeholder="Satu poin progress per baris"
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <NumberField name="productionIncidentCount" label="Production incidents" defaultValue={defaultValues?.productionIncidentCount} />
        <div className="space-y-2">
          <Label htmlFor="bugDocumentUrl">Bug document URL</Label>
          <Input id="bugDocumentUrl" name="bugDocumentUrl" type="url" defaultValue={defaultValues?.bugDocumentUrl ?? ""} />
        </div>
      </section>
      <div className="space-y-2">
        <Label htmlFor="productionIncidentNotes">Production incident notes</Label>
        <IncidentListInput name="productionIncidentNotes" label="" defaultValue={defaultValues?.productionIncidentNotes} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField name="testCaseBeTotal" label="Test case BE total" defaultValue={defaultValues?.testCaseBeTotal} />
        <NumberField name="testCaseBeExecuted" label="Test case BE executed" defaultValue={defaultValues?.testCaseBeExecuted} />
        <NumberField name="testCaseFeTotal" label="Test case FE total" defaultValue={defaultValues?.testCaseFeTotal} />
        <NumberField name="testCaseFeExecuted" label="Test case FE executed" defaultValue={defaultValues?.testCaseFeExecuted} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField name="automationBeTotal" label="Automation BE total" defaultValue={defaultValues?.automationBeTotal} />
        <NumberField name="automationFeTotal" label="Automation FE total" defaultValue={defaultValues?.automationFeTotal} />
        <NumberField name="automationPassed" label="Automation passed" defaultValue={defaultValues?.automationPassed} />
        <NumberField name="automationFailed" label="Automation failed" defaultValue={defaultValues?.automationFailed} />
      </section>

      <BulletListInput
        name="blocker"
        label="Blocker"
        defaultValue={defaultValues?.blocker}
        placeholder="Satu blocker per baris"
      />
      <BulletListInput
        name="nextWeekPlan"
        label="Next week plan"
        defaultValue={defaultValues?.nextWeekPlan}
        placeholder="Satu rencana per baris"
      />
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
