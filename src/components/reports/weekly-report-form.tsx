"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BulletListInput } from "@/components/ui/bullet-list-input";
import { IncidentListInput } from "@/components/ui/incident-list-input";
import { parseIncidentCountInput, parseIncidents } from "@/lib/reports/incidents";
import type { WeeklyReportActionState, WeeklyReportFieldErrors } from "@/lib/weekly-reports/form-state";

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

function NumberField({ name, label, defaultValue, error, required, value, onChange }: { name: string; label: string; defaultValue?: number | string; error?: string; required?: boolean; value?: string; onChange?: (value: string) => void }) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} {required ? <RequiredMark /> : null}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        placeholder="0"
        {...(controlled ? { value, onChange: (event) => onChange(event.target.value) } : { defaultValue })}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      <FieldError id={`${name}-error`} message={error} />
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
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
  const fieldErrors: WeeklyReportFieldErrors = state.fieldErrors ?? {};
  const errorSignature = state.fieldErrors ? JSON.stringify(state.fieldErrors) : "";
  const formKey = state.values ? JSON.stringify(state.values) : "initial";
  const formRef = useRef<HTMLFormElement>(null);
  const [productionIncidentCount, setProductionIncidentCount] = useState(() => {
    if (values.productionIncidentCount !== undefined) {
      return String(values.productionIncidentCount);
    }

    const incidents = parseIncidents(values.productionIncidentNotes);
    return incidents.length > 0 ? String(incidents.length) : "";
  });
  const incidentCount = parseIncidentCountInput(productionIncidentCount);
  const [testCaseBeTotal, setTestCaseBeTotal] = useState(() =>
    values.testCaseBeTotal !== undefined && values.testCaseBeTotal !== null ? String(values.testCaseBeTotal) : "",
  );
  const [testCaseFeTotal, setTestCaseFeTotal] = useState(() =>
    values.testCaseFeTotal !== undefined && values.testCaseFeTotal !== null ? String(values.testCaseFeTotal) : "",
  );
  const [testCaseTotal, setTestCaseTotal] = useState(() =>
    values.testCaseTotal !== undefined && values.testCaseTotal !== null ? String(values.testCaseTotal) : "",
  );
  const beFeSum = (Number(testCaseBeTotal) || 0) + (Number(testCaseFeTotal) || 0);
  const totalTestCaseValue = Number(testCaseTotal) || 0;
  const coverageShortfall = testCaseTotal !== "" && beFeSum < totalTestCaseValue;

  useEffect(() => {
    if (!errorSignature) return;
    const form = formRef.current;
    if (!form) return;
    const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!firstInvalid) return;
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
  }, [errorSignature]);

  return (
    <form key={formKey} ref={formRef} action={formAction} className="space-y-6">
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
              aria-invalid={fieldErrors.projectId ? true : undefined}
              aria-describedby={fieldErrors.projectId ? "projectId-error" : undefined}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
            >
              <option value="">Pilih project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {lockProject ? <input type="hidden" name="projectId" value={values.projectId} /> : null}
            <FieldError id="projectId-error" message={fieldErrors.projectId} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekStartDate">Week start</RequiredLabel>
            <Input id="weekStartDate" name="weekStartDate" type="date" defaultValue={values.weekStartDate} required aria-invalid={fieldErrors.weekStartDate ? true : undefined} aria-describedby={fieldErrors.weekStartDate ? "weekStartDate-error" : undefined} />
            <FieldError id="weekStartDate-error" message={fieldErrors.weekStartDate} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekEndDate">Week end</RequiredLabel>
            <Input id="weekEndDate" name="weekEndDate" type="date" defaultValue={values.weekEndDate} required aria-invalid={fieldErrors.weekEndDate ? true : undefined} aria-describedby={fieldErrors.weekEndDate ? "weekEndDate-error" : undefined} />
            <FieldError id="weekEndDate-error" message={fieldErrors.weekEndDate} />
          </div>
        </div>
      </FormSection>

      <FormSection title={<>Summary <RequiredMark /></>} description="Ringkasan pekerjaan minggu ini, satu poin per baris.">
        <BulletListInput
          name="summary"
          label=""
          defaultValue={values.summary}
          placeholder="Satu poin progress per baris"
          error={fieldErrors.summary}
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
            <RequiredLabel htmlFor="bugDocumentUrl">Bug document URL</RequiredLabel>
            <Input id="bugDocumentUrl" name="bugDocumentUrl" type="url" defaultValue={values.bugDocumentUrl ?? ""} aria-invalid={fieldErrors.bugDocumentUrl ? true : undefined} aria-describedby={fieldErrors.bugDocumentUrl ? "bugDocumentUrl-error" : undefined} />
            <FieldError id="bugDocumentUrl-error" message={fieldErrors.bugDocumentUrl} />
          </div>
        </div>
        <IncidentListInput
          name="productionIncidentNotes"
          label=""
          defaultValue={values.productionIncidentNotes}
          count={incidentCount}
          onCountChange={(count) => setProductionIncidentCount(String(count))}
          error={fieldErrors.productionIncidentNotes}
          rowErrors={fieldErrors}
        />
      </FormSection>

      <FormSection title="Test case" description="Total test case diisi manual. BE + FE wajib lebih besar atau sama dengan total.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField name="testCaseTotal" label="Test case total" value={testCaseTotal} onChange={setTestCaseTotal} required error={fieldErrors.testCaseTotal} />
          <NumberField name="testCaseBeTotal" label="Test case BE total" value={testCaseBeTotal} onChange={setTestCaseBeTotal} required error={fieldErrors.testCaseBeTotal} />
          <NumberField name="testCaseFeTotal" label="Test case FE total" value={testCaseFeTotal} onChange={setTestCaseFeTotal} required error={fieldErrors.testCaseFeTotal} />
        </div>
        <p className={`text-xs ${coverageShortfall ? "text-destructive" : "text-muted-foreground"}`}>
          BE + FE = {beFeSum}{coverageShortfall ? ` (kurang dari total ${totalTestCaseValue})` : null}
        </p>
      </FormSection>

      <FormSection title="Automation" description="Coverage dan hasil run automation per platform.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-medium text-foreground">Backend</h4>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
              <NumberField name="automationBeTotal" label="BE total" defaultValue={values.automationBeTotal} error={fieldErrors.automationBeTotal} />
              <NumberField name="automationBePassed" label="BE passed" defaultValue={values.automationBePassed ?? undefined} error={fieldErrors.automationBePassed} />
              <NumberField name="automationBeFailed" label="BE failed" defaultValue={values.automationBeFailed ?? undefined} />
            </div>
          </div>
          <div className="space-y-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-medium text-foreground">Frontend</h4>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
              <NumberField name="automationFeTotal" label="FE total" defaultValue={values.automationFeTotal} error={fieldErrors.automationFeTotal} />
              <NumberField name="automationFePassed" label="FE passed" defaultValue={values.automationFePassed ?? undefined} error={fieldErrors.automationFePassed} />
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
          error={fieldErrors.nextWeekPlan}
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
