"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { BulletListInput } from "@/components/ui/bullet-list-input";
import { IncidentListInput } from "@/components/ui/incident-list-input";
import { parseIncidentCountInput, parseIncidents } from "@/lib/reports/incidents";
import type { WeeklyReportActionState, WeeklyReportConflict, WeeklyReportFieldErrors } from "@/lib/weekly-reports/form-state";

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
  checkExistingReport?: (projectId: string, weekStartDate: string, weekEndDate: string) => Promise<WeeklyReportConflict | null>;
  projects: ProjectOption[];
  defaultValues?: WeeklyReportDefaults;
  initialReportConflict?: WeeklyReportConflict | null;
  submitLabel: string;
  cancelHref?: string;
  lockProject?: boolean;
};

function NumberField({ name, label, defaultValue, error, warning, required, value, onChange }: { name: string; label: string; defaultValue?: number | string; error?: string; warning?: string; required?: boolean; value?: string; onChange?: (value: string) => void }) {
  const controlled = value !== undefined && onChange !== undefined;
  const invalid = Boolean(error || warning);
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
  aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? `${name}-error` : undefined}
      />
      <FieldError id={`${name}-error`} message={error ?? warning} />
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
    <section className="space-y-5 border-b border-border/70 pb-6">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function reportHref(conflict: WeeklyReportConflict) {
  return conflict.report.canEdit ? `/weekly-reports/${conflict.report.id}/edit` : `/weekly-reports/${conflict.report.id}`;
}

function reportActionLabel(conflict: WeeklyReportConflict) {
  return conflict.report.canEdit ? "Lanjut edit report" : "Lihat report";
}

function conflictActor(conflict: WeeklyReportConflict) {
  return conflict.report.createdByName?.trim() || conflict.report.createdByEmail?.trim() || "QA lain";
}

function ReportConflictNotice({ conflict }: { conflict: WeeklyReportConflict }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
            <AlertTriangle className="size-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">Report untuk project dan periode ini sudah ada.</p>
              <StatusBadge status={conflict.report.status} />
            </div>
            <p className="max-w-2xl text-muted-foreground">
              Gunakan report yang sudah dibuat oleh {conflictActor(conflict)} supaya QA dalam project yang sama tidak mengisi form ganda.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={reportHref(conflict)}>
            <FileText className="size-4" />
            {reportActionLabel(conflict)}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function existingLookupKey(projectId?: string, weekStartDate?: string, weekEndDate?: string) {
  return projectId && weekStartDate && weekEndDate ? `${projectId}:${weekStartDate}:${weekEndDate}` : "";
}

function isNonNegativeIntValue(value: string) {
  if (value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}

function isValidUrlValue(value: string) {
  if (!value.trim()) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isFilledListValue(value: string) {
  return value.trim().length > 0;
}

function isIncidentValueValid(value: string, count: number) {
  if (count <= 0) return true;

  const incidents = parseIncidents(value);
  if (incidents.length < count) return false;

  return incidents
    .slice(0, count)
    .every((incident) => incident.title.trim() && incident.description.trim() && incident.relatedTestCaseId.trim());
}

export function WeeklyReportForm({
  action,
  checkExistingReport,
  projects,
  defaultValues,
  initialReportConflict,
  submitLabel,
  cancelHref,
  lockProject,
}: WeeklyReportFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...defaultValues, ...state.values };
  const errorSignature = state.fieldErrors ? JSON.stringify(state.fieldErrors) : "";
  const [clearedErrors, setClearedErrors] = useState<{ signature: string; keys: string[] }>({ signature: "", keys: [] });
  const clearedErrorKeys = clearedErrors.signature === errorSignature ? new Set(clearedErrors.keys) : new Set<string>();
  const fieldErrors: WeeklyReportFieldErrors = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).filter(([key]) => !clearedErrorKeys.has(key)),
  );
  const formKey = state.values ? JSON.stringify(state.values) : "initial";
  const formRef = useRef<HTMLFormElement>(null);
  const initialProjectId = values.projectId ?? "";
  const initialWeekStartDate = values.weekStartDate ?? "";
  const initialWeekEndDate = values.weekEndDate ?? "";
  const [projectId, setProjectId] = useState(initialProjectId);
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStartDate);
  const [weekEndDate, setWeekEndDate] = useState(initialWeekEndDate);
  const [reportConflict, setReportConflict] = useState<WeeklyReportConflict | null>(initialReportConflict ?? null);
  const [checkingExistingReport, setCheckingExistingReport] = useState(false);
  const initialExistingLookupKey = existingLookupKey(initialProjectId, initialWeekStartDate, initialWeekEndDate);
  const currentLookupKey = existingLookupKey(projectId, weekStartDate, weekEndDate);
  const duplicateLookupKey = existingLookupKey(state.values?.projectId, state.values?.weekStartDate, state.values?.weekEndDate);
  const actionConflict = duplicateLookupKey && duplicateLookupKey === currentLookupKey ? state.reportConflict : null;
  const matchingInitialConflict = currentLookupKey && currentLookupKey === initialExistingLookupKey ? initialReportConflict : null;
  const visibleReportConflict = actionConflict ?? reportConflict ?? matchingInitialConflict;
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

  const [automationBeTotal, setAutomationBeTotal] = useState(() =>
    values.automationBeTotal !== undefined && values.automationBeTotal !== null ? String(values.automationBeTotal) : "",
  );
  const [automationBePassed, setAutomationBePassed] = useState(() =>
  values.automationBePassed !== undefined && values.automationBePassed !== null ? String(values.automationBePassed) : "",
  );
  const [automationBeFailed, setAutomationBeFailed] = useState(() =>
    values.automationBeFailed !== undefined && values.automationBeFailed !== null ? String(values.automationBeFailed) : "",
  );
  const [automationFeTotal, setAutomationFeTotal] = useState(() =>
    values.automationFeTotal !== undefined && values.automationFeTotal !== null ? String(values.automationFeTotal) : "",
  );
  const [automationFePassed, setAutomationFePassed] = useState(() =>
    values.automationFePassed !== undefined && values.automationFePassed !== null ? String(values.automationFePassed) : "",
  );
  const [automationFeFailed, setAutomationFeFailed] = useState(() =>
    values.automationFeFailed !== undefined && values.automationFeFailed !== null ? String(values.automationFeFailed) : "",
  );

  const beTotalNum = Number(automationBeTotal) || 0;
  const bePassedNum = Number(automationBePassed) || 0;
  const beFailedNum = Number(automationBeFailed) || 0;
  const beTcTotal = Number(testCaseBeTotal) || 0;
  const feTotalNum = Number(automationFeTotal) || 0;
  const fePassedNum = Number(automationFePassed) || 0;
  const feFailedNum = Number(automationFeFailed) || 0;
  const feTcTotal = Number(testCaseFeTotal) || 0;

  const beTotalExceeds = automationBeTotal !== "" && testCaseBeTotal !== "" && beTotalNum > beTcTotal;
  const bePassFailExceeds =
    automationBeTotal !== "" && (bePassedNum + beFailedNum > beTotalNum);
  const feTotalExceeds = automationFeTotal !== "" && testCaseFeTotal !== "" && feTotalNum > feTcTotal;
  const fePassFailExceeds =
    automationFeTotal !== "" && (fePassedNum + feFailedNum > feTotalNum);
  const visibleErrorCount = Object.keys(fieldErrors).length;
  const showFormError = Boolean(state.error && (!state.fieldErrors || visibleErrorCount > 0));

  function clearFieldErrors(keys: string[]) {
    if (!errorSignature) return;

    setClearedErrors((current) => {
      const existing = current.signature === errorSignature ? current.keys : [];
      const next = Array.from(new Set([...existing, ...keys.filter((key) => key in (state.fieldErrors ?? {}))]));
      if (next.length === existing.length) return current;
      return { signature: errorSignature, keys: next };
    });
  }

  function clearFieldErrorWhenValid(key: string, valid: boolean) {
    if (valid) clearFieldErrors([key]);
  }

  function clearTestCaseErrors(nextValues: {
    testCaseTotal?: string;
    testCaseBeTotal?: string;
    testCaseFeTotal?: string;
  }) {
    const nextTotal = nextValues.testCaseTotal ?? testCaseTotal;
    const nextBe = nextValues.testCaseBeTotal ?? testCaseBeTotal;
    const nextFe = nextValues.testCaseFeTotal ?? testCaseFeTotal;
    const keysToClear: string[] = [];

    if (isNonNegativeIntValue(nextTotal)) keysToClear.push("testCaseTotal");
    if (isNonNegativeIntValue(nextBe)) keysToClear.push("testCaseBeTotal");
    if (isNonNegativeIntValue(nextFe)) keysToClear.push("testCaseFeTotal");

    if (isNonNegativeIntValue(nextTotal) && isNonNegativeIntValue(nextBe) && isNonNegativeIntValue(nextFe)) {
      const total = Number(nextTotal);
      const be = Number(nextBe);
      const fe = Number(nextFe);
      if (be + fe >= total) keysToClear.push("testCaseTotal");
    }

    clearFieldErrors(keysToClear);
  }

  function clearAutomationErrors(nextValues: {
    automationBeTotal?: string;
    automationBePassed?: string;
    automationBeFailed?: string;
    automationFeTotal?: string;
    automationFePassed?: string;
    automationFeFailed?: string;
  }) {
    const nextBeTotal = nextValues.automationBeTotal ?? automationBeTotal;
    const nextBePassed = nextValues.automationBePassed ?? automationBePassed;
    const nextBeFailed = nextValues.automationBeFailed ?? automationBeFailed;
    const nextFeTotal = nextValues.automationFeTotal ?? automationFeTotal;
    const nextFePassed = nextValues.automationFePassed ?? automationFePassed;
    const nextFeFailed = nextValues.automationFeFailed ?? automationFeFailed;
    const keysToClear: string[] = [];

    if (isNonNegativeIntValue(nextBeTotal) && Number(nextBeTotal) <= beTcTotal) keysToClear.push("automationBeTotal");
    if (
      isNonNegativeIntValue(nextBePassed) &&
      isNonNegativeIntValue(nextBeFailed || "0") &&
      Number(nextBePassed) + Number(nextBeFailed || 0) <= Number(nextBeTotal || 0)
    ) {
      keysToClear.push("automationBePassed");
    }
    if (isNonNegativeIntValue(nextFeTotal) && Number(nextFeTotal) <= feTcTotal) keysToClear.push("automationFeTotal");
    if (
      isNonNegativeIntValue(nextFePassed) &&
      isNonNegativeIntValue(nextFeFailed || "0") &&
      Number(nextFePassed) + Number(nextFeFailed || 0) <= Number(nextFeTotal || 0)
    ) {
      keysToClear.push("automationFePassed");
    }

    clearFieldErrors(keysToClear);
  }

  useEffect(() => {
    if (!errorSignature) return;
    const form = formRef.current;
    if (!form) return;
    const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!firstInvalid) return;
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
  }, [errorSignature]);

  useEffect(() => {
    if (!checkExistingReport || !projectId || !weekStartDate || !weekEndDate || weekStartDate >= weekEndDate) {
      return;
    }

    const currentLookupKey = existingLookupKey(projectId, weekStartDate, weekEndDate);
    if (currentLookupKey === initialExistingLookupKey && initialReportConflict) {
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      setCheckingExistingReport(true);
      checkExistingReport(projectId, weekStartDate, weekEndDate)
        .then((conflict) => {
          if (active) setReportConflict(conflict);
        })
        .finally(() => {
          if (active) setCheckingExistingReport(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [checkExistingReport, initialExistingLookupKey, initialReportConflict, projectId, weekEndDate, weekStartDate]);

  function resetExistingReportLookup() {
    setReportConflict(null);
    setCheckingExistingReport(false);
  }

  return (
    <form key={formKey} ref={formRef} action={formAction} className="space-y-6">
      {showFormError ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

      <FormSection title="Periode & project" description="Pilih project dan tentukan rentang minggu yang dilaporkan. Setiap report mencakup satu minggu penuh.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor="projectId">Project</RequiredLabel>
            <select
              id="projectId"
              name="projectId"
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                clearFieldErrorWhenValid("projectId", Boolean(event.target.value));
                resetExistingReportLookup();
              }}
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
            {lockProject ? <input type="hidden" name="projectId" value={projectId} /> : null}
            <FieldError id="projectId-error" message={fieldErrors.projectId} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekStartDate">Week start</RequiredLabel>
            <Input id="weekStartDate" name="weekStartDate" type="date" value={weekStartDate} onChange={(event) => {
              setWeekStartDate(event.target.value);
              clearFieldErrorWhenValid("weekStartDate", Boolean(event.target.value));
              resetExistingReportLookup();
            }} required aria-invalid={fieldErrors.weekStartDate ? true : undefined} aria-describedby={fieldErrors.weekStartDate ? "weekStartDate-error" : undefined} />
            <FieldError id="weekStartDate-error" message={fieldErrors.weekStartDate} />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="weekEndDate">Week end</RequiredLabel>
            <Input id="weekEndDate" name="weekEndDate" type="date" value={weekEndDate} onChange={(event) => {
              setWeekEndDate(event.target.value);
              clearFieldErrorWhenValid("weekEndDate", Boolean(event.target.value && weekStartDate && weekStartDate < event.target.value));
              resetExistingReportLookup();
            }} required aria-invalid={fieldErrors.weekEndDate ? true : undefined} aria-describedby={fieldErrors.weekEndDate ? "weekEndDate-error" : undefined} />
            <FieldError id="weekEndDate-error" message={fieldErrors.weekEndDate} />
          </div>
        </div>
        {checkingExistingReport ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Mengecek report untuk periode ini...
          </p>
        ) : null}
        {visibleReportConflict ? <ReportConflictNotice conflict={visibleReportConflict} /> : null}
      </FormSection>

      {!visibleReportConflict ? (
        <>
      <FormSection title={<>Summary <RequiredMark /></>} description="Tuliskan poin-poin utama pekerjaan yang diselesaikan minggu ini. Gunakan bullet list untuk memudahkan pembacaan.">
        <BulletListInput
          name="summary"
          label=""
          defaultValue={values.summary}
          placeholder="Satu poin progress per baris"
          error={fieldErrors.summary}
          onValueChange={(value) => clearFieldErrorWhenValid("summary", isFilledListValue(value))}
        />
      </FormSection>

      <FormSection title="Production incident" description="Laporkan bug atau masalah yang terjadi di production minggu ini. Jika tidak ada, biarkan kosong.">
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
              onChange={(event) => {
                const nextCount = event.target.value;
                setProductionIncidentCount(nextCount);
                if (Number(nextCount) <= 0) clearFieldErrors(["productionIncidentNotes"]);
              }}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="bugDocumentUrl">Bug document URL</RequiredLabel>
            <Input
              id="bugDocumentUrl"
              name="bugDocumentUrl"
              type="url"
              defaultValue={values.bugDocumentUrl ?? ""}
              onChange={(event) => clearFieldErrorWhenValid("bugDocumentUrl", isValidUrlValue(event.target.value))}
              aria-invalid={fieldErrors.bugDocumentUrl ? true : undefined}
              aria-describedby={fieldErrors.bugDocumentUrl ? "bugDocumentUrl-error" : undefined}
            />
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
          onValueChange={(value) => clearFieldErrorWhenValid("productionIncidentNotes", isIncidentValueValid(value, incidentCount))}
        />
      </FormSection>

      <FormSection title="Test case" description="Masukkan jumlah test case manual yang sudah dieksekusi minggu ini. Pisahkan antara backend dan frontend. Total BE + FE harus sama atau lebih besar dari jumlah total.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField name="testCaseTotal" label="Test case total" value={testCaseTotal} onChange={(value) => {
            setTestCaseTotal(value);
            clearTestCaseErrors({ testCaseTotal: value });
          }} required error={fieldErrors.testCaseTotal} />
          <NumberField name="testCaseBeTotal" label="Test case BE total" value={testCaseBeTotal} onChange={(value) => {
            setTestCaseBeTotal(value);
            clearTestCaseErrors({ testCaseBeTotal: value });
          }} required error={fieldErrors.testCaseBeTotal} />
          <NumberField name="testCaseFeTotal" label="Test case FE total" value={testCaseFeTotal} onChange={(value) => {
            setTestCaseFeTotal(value);
            clearTestCaseErrors({ testCaseFeTotal: value });
          }} required error={fieldErrors.testCaseFeTotal} />
        </div>
        <p className={`text-xs ${coverageShortfall ? "text-destructive" : "text-muted-foreground"}`}>
          BE + FE = {beFeSum}{coverageShortfall ? ` (kurang dari total ${totalTestCaseValue})` : null}
        </p>
      </FormSection>

      <FormSection title="Automation" description="Laporkan hasil eksekusi test automation minggu ini. Masukkan total test case yang di-automate, jumlah yang passed, dan jumlah yang failed untuk backend dan frontend. Total automation tidak boleh melebihi jumlah test case manual.">
      <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-4 rounded-md border border-border/70 p-4">
    <h4 className="text-sm font-medium text-foreground">Backend</h4>
   <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
     <NumberField
   name="automationBeTotal"
   label="BE total"
   value={automationBeTotal}
   onChange={(value) => {
     setAutomationBeTotal(value);
     clearAutomationErrors({ automationBeTotal: value });
   }}
   error={fieldErrors.automationBeTotal}
    warning={
beTotalExceeds
                ? `Tidak boleh lebih dari Test case BE total (${beTcTotal})`
: undefined
           }
              />
        <NumberField
          name="automationBePassed"
    label="BE passed"
         value={automationBePassed}
       onChange={(value) => {
         setAutomationBePassed(value);
         clearAutomationErrors({ automationBePassed: value });
       }}
       error={fieldErrors.automationBePassed}
        warning={
       bePassFailExceeds
 ? `Passed + Failed (${bePassedNum + beFailedNum}) melebihi BE total (${beTotalNum})`
                : undefined
           }
     />
       <NumberField
        name="automationBeFailed"
        label="BE failed"
        value={automationBeFailed}
    onChange={(value) => {
      setAutomationBeFailed(value);
      clearAutomationErrors({ automationBeFailed: value });
    }}
       />
  </div>
 </div>
     <div className="space-y-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-medium text-foreground">Frontend</h4>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
   <NumberField
    name="automationFeTotal"
   label="FE total"
       value={automationFeTotal}
   onChange={(value) => {
     setAutomationFeTotal(value);
     clearAutomationErrors({ automationFeTotal: value });
   }}
error={fieldErrors.automationFeTotal}
         warning={
  feTotalExceeds
            ? `Tidak boleh lebih dari Test case FE total (${feTcTotal})`
       : undefined
     }
  />
   <NumberField
     name="automationFePassed"
       label="FE passed"
      value={automationFePassed}
  onChange={(value) => {
    setAutomationFePassed(value);
    clearAutomationErrors({ automationFePassed: value });
  }}
   error={fieldErrors.automationFePassed}
       warning={
   fePassFailExceeds
  ? `Passed + Failed (${fePassedNum + feFailedNum}) melebihi FE total (${feTotalNum})`
   : undefined
            }
              />
          <NumberField
             name="automationFeFailed"
        label="FE failed"
           value={automationFeFailed}
       onChange={(value) => {
         setAutomationFeFailed(value);
         clearAutomationErrors({ automationFeFailed: value });
       }}
         />
    </div>
    </div>
    </div>
        {hasValue(values.automationPassed) ? <input type="hidden" name="automationPassed" value={String(values.automationPassed)} /> : null}
    {hasValue(values.automationFailed) ? <input type="hidden" name="automationFailed" value={String(values.automationFailed)} /> : null}
      </FormSection>

      <FormSection title="Blocker & plan" description="Tuliskan kendala yang menghambat progress minggu ini, rencana pekerjaan minggu depan, dan catatan tambahan jika ada.">
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
          onValueChange={(value) => clearFieldErrorWhenValid("nextWeekPlan", isFilledListValue(value))}
        />
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={values.notes ?? ""} />
        </div>
      </FormSection>
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {visibleReportConflict ? (
          <Button asChild>
            <Link href={reportHref(visibleReportConflict)}>
              <FileText className="size-4" />
              {reportActionLabel(visibleReportConflict)}
            </Link>
          </Button>
        ) : (
   <Button type="submit" disabled={pending || checkingExistingReport}>
     {pending ? "Saving..." : submitLabel}
 </Button>
        )}
        {cancelHref ? (
        <Button type="button" variant="outline" asChild disabled={pending}>
   <Link href={cancelHref}>Cancel</Link>
        </Button>
      ) : null}
</div>
    </form>
  );
}
