"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BulletListInput } from "@/components/ui/bullet-list-input";
import { IncidentListInput } from "@/components/ui/incident-list-input";
import { parseIncidentCountInput, parseIncidents } from "@/lib/reports/incidents";
import type { WeeklyReportActionState } from "@/lib/weekly-reports/form-state";

type ProjectOption = { id: string; name: string };

export type WeeklyReportDefaults = {
  projectId?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  summary?: string;
  productionIncidentCount?: number | string;
  productionIncidentNotes?: string | null;
  bugDocumentUrl?: string | null;
  testCaseTotal?: number | string | null;
  testCaseBeTotal?: number | string;
  testCaseFeTotal?: number | string;
  automationBeTotal?: number | string;
  automationFeTotal?: number | string;
  automationBePassed?: number | string | null;
  automationBeFailed?: number | string | null;
  automationFePassed?: number | string | null;
  automationFeFailed?: number | string | null;
  automationPassed?: number | string;
  automationFailed?: number | string;
  blocker?: string | null;
  nextWeekPlan?: string;
  notes?: string | null;
};

type WeeklyReportFormProps = {
  action: (state: WeeklyReportActionState, formData: FormData) => Promise<WeeklyReportActionState>;
  projects: ProjectOption[];
  defaultValues?: WeeklyReportDefaults;
  submitLabel: string;
  lockProject?: boolean;
};

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number | string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} placeholder="0" defaultValue={defaultValue} />
    </div>
  );
}

function hasValue(value: number | string | null | undefined): value is number | string {
  return value !== null && value !== undefined && value !== "";
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <Label htmlFor={htmlFor}>{children} <RequiredMark /></Label>;
}

function FormSection({ title, description, children }: { title: React.ReactNode; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function WeeklyReportForm({ action, projects, defaultValues, submitLabel, lockProject }: WeeklyReportFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...defaultValues, ...state.values };
  const formKey = state.values ? JSON.stringify(state.values) : "initial";
  const [productionIncidentCount, setProductionIncidentCount] = useState(() => {
    if (values.productionIncidentCount !== undefined) {
      return String(values.productionIncidentCount);
    }

    const incidents = parseIncidents(values.productionIncidentNotes);
    return incidents.length > 0 ? String(incidents.length) : "";
  });
  const incidentCount = parseIncidentCountInput(productionIncidentCount);

  return (
    <form key={formKey} action={formAction} className="space-y-6">
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

      <FormSection title="Periode & project" description="Project yang direport dan rentang minggunya.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor="projectId">Project</RequiredLabel>
            <select
              id="projectId"
              name="projectId"
              defaultValue={values.projectId ?? ""}
              disabled={lockProject}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
            >
              <option value="">Pilih project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {lockProject ? <input type="hidden" name="projectId" value={values.projectId} /> : null}
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekStartDate">Week start</RequiredLabel>
            <Input id="weekStartDate" name="weekStartDate" type="date" defaultValue={values.weekStartDate} required />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekEndDate">Week end</RequiredLabel>
            <Input id="weekEndDate" name="weekEndDate" type="date" defaultValue={values.weekEndDate} required />
          </div>
        </div>
      </FormSection>

      <FormSection title={<>Summary <RequiredMark /></>} description="Ringkasan pekerjaan minggu ini, satu poin per baris.">
        <BulletListInput
          name="summary"
          label=""
          defaultValue={values.summary}
          placeholder="Satu poin progress per baris"
        />
      </FormSection>

      <FormSection title="Production incident" description="Jumlah, link dokumen bug, dan detail tiap incident.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productionIncidentCount">Production incidents</Label>
            <Input
              id="productionIncidentCount"
              name="productionIncidentCount"
              type="number"
              min={0}
              placeholder="0"
              value={productionIncidentCount}
              onChange={(event) => setProductionIncidentCount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bugDocumentUrl">Bug document URL</Label>
            <Input id="bugDocumentUrl" name="bugDocumentUrl" type="url" defaultValue={values.bugDocumentUrl ?? ""} />
          </div>
        </div>
        <IncidentListInput
          name="productionIncidentNotes"
          label=""
          defaultValue={values.productionIncidentNotes}
          count={incidentCount}
          onCountChange={(count) => setProductionIncidentCount(String(count))}
        />
      </FormSection>

      <FormSection title="Test case" description="Total unique test case dan cakupan BE/FE.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField name="testCaseTotal" label="Test case total" defaultValue={values.testCaseTotal ?? undefined} />
          <NumberField name="testCaseBeTotal" label="Test case BE total" defaultValue={values.testCaseBeTotal} />
          <NumberField name="testCaseFeTotal" label="Test case FE total" defaultValue={values.testCaseFeTotal} />
        </div>
      </FormSection>

      <FormSection title="Automation" description="Coverage dan hasil run automation per platform.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-medium text-foreground">Backend</h4>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
              <NumberField name="automationBeTotal" label="BE total" defaultValue={values.automationBeTotal} />
              <NumberField name="automationBePassed" label="BE passed" defaultValue={values.automationBePassed ?? undefined} />
              <NumberField name="automationBeFailed" label="BE failed" defaultValue={values.automationBeFailed ?? undefined} />
            </div>
          </div>
          <div className="space-y-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-medium text-foreground">Frontend</h4>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
              <NumberField name="automationFeTotal" label="FE total" defaultValue={values.automationFeTotal} />
              <NumberField name="automationFePassed" label="FE passed" defaultValue={values.automationFePassed ?? undefined} />
              <NumberField name="automationFeFailed" label="FE failed" defaultValue={values.automationFeFailed ?? undefined} />
            </div>
          </div>
        </div>
        {hasValue(values.automationPassed) ? <input type="hidden" name="automationPassed" value={String(values.automationPassed)} /> : null}
        {hasValue(values.automationFailed) ? <input type="hidden" name="automationFailed" value={String(values.automationFailed)} /> : null}
      </FormSection>

      <FormSection title="Blocker & plan" description="Kendala minggu ini, rencana minggu depan, dan catatan tambahan.">
        <BulletListInput
          name="blocker"
          label="Blocker"
          defaultValue={values.blocker}
          placeholder="Satu blocker per baris"
        />
        <BulletListInput
          name="nextWeekPlan"
          label="Next week plan"
          defaultValue={values.nextWeekPlan}
          placeholder="Satu rencana per baris"
          required
        />
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={values.notes ?? ""} />
        </div>
      </FormSection>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
