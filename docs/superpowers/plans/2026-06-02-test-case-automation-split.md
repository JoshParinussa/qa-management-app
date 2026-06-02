# Test Case Automation Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual total test case plus BE/FE-split automation coverage and pass-rate inputs/outputs.

**Architecture:** Extend the weekly report persistence model with new numeric fields and derived split metrics. Keep existing aggregate automation fields for compatibility, while UI, monthly, dashboard, and export prefer BE/FE split metrics.

**Tech Stack:** Next.js App Router, React 19, Drizzle ORM, PostgreSQL, Zod 4, Vitest, TypeScript.

**Commit Policy:** Do not commit during execution unless the user explicitly asks.

---

## File Map

- Modify `src/db/schema.ts`: add weekly report columns for total test case, split automation pass/fail, split coverage, split pass rate.
- Generate `drizzle/*.sql` + `drizzle/meta/*`: schema migration from Drizzle.
- Modify `src/lib/reports/calculator.ts`: calculate split coverage/pass rates.
- Modify `src/lib/reports/calculator.test.ts`: TDD for new metrics.
- Modify `src/lib/validations/weekly-report.ts`: add fields and split validation.
- Modify `src/lib/validations/weekly-report.test.ts`: validation tests.
- Modify `src/lib/weekly-reports/actions.ts`: parse new fields, store split metrics, backfill compatibility aggregate fields.
- Modify `src/lib/weekly-reports/form-state.ts`: preserve new form fields after errors.
- Modify `src/lib/weekly-reports/form-state.test.ts`: state preservation tests.
- Modify `src/components/reports/weekly-report-form.tsx`: UX for total test case and grouped BE/FE automation.
- Modify `src/app/(dashboard)/weekly-reports/[id]/edit/page.tsx`: pass new defaults.
- Modify `src/app/(dashboard)/weekly-reports/[id]/page.tsx`: display split metrics.
- Modify `src/lib/monthly-reports/aggregate.ts`: split monthly summary for tests.
- Modify `src/lib/monthly-reports/aggregate.test.ts`: split monthly expectations.
- Modify `src/lib/monthly-reports/queries.ts`: aggregate split DB fields.
- Modify `src/components/monthly-reports/monthly-summary.tsx`: display split monthly metrics.
- Modify `src/lib/monthly-reports/export-markdown.ts`: export split metrics.
- Modify `src/lib/monthly-reports/export-markdown.test.ts`: export expectations.
- Modify `src/lib/dashboard/queries.ts`: return avg BE/FE coverage.
- Modify `src/app/(dashboard)/dashboard/page.tsx`: show BE/FE coverage per project.

---

### Task 1: Metrics Calculator

**Files:**
- Modify: `src/lib/reports/calculator.test.ts`
- Modify: `src/lib/reports/calculator.ts`

- [ ] **Step 1: Write failing calculator tests**

Patch `src/lib/reports/calculator.test.ts` so `base` includes new fields:

```ts
const base = {
  testCaseTotal: 0,
  testCaseBeTotal: 0,
  testCaseFeTotal: 0,
  testCaseBeExecuted: 0,
  testCaseFeExecuted: 0,
  automationBeTotal: 0,
  automationFeTotal: 0,
  automationBePassed: 0,
  automationBeFailed: 0,
  automationFePassed: 0,
  automationFeFailed: 0,
  automationPassed: 0,
  automationFailed: 0,
};
```

Add this test:

```ts
it("computes split automation coverage and pass rates", () => {
  const result = calculateReportMetrics({
    ...base,
    testCaseTotal: 120,
    testCaseBeTotal: 100,
    testCaseFeTotal: 40,
    automationBeTotal: 50,
    automationFeTotal: 20,
    automationBePassed: 45,
    automationBeFailed: 5,
    automationFePassed: 18,
    automationFeFailed: 2,
  });

  expect(result.totalTestCase).toBe(120);
  expect(result.totalAutomation).toBe(70);
  expect(result.totalAutomationRun).toBe(70);
  expect(result.automationBeCoverage).toBe(50);
  expect(result.automationFeCoverage).toBe(50);
  expect(result.automationBePassRate).toBe(90);
  expect(result.automationFePassRate).toBe(90);
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- src/lib/reports/calculator.test.ts`

Expected: FAIL because split metric properties do not exist or values are wrong.

- [ ] **Step 3: Implement calculator fields**

Replace `src/lib/reports/calculator.ts` input/output logic with:

```ts
type ReportMetricsInput = {
  testCaseTotal?: number;
  testCaseBeTotal: number;
  testCaseFeTotal: number;
  testCaseBeExecuted: number;
  testCaseFeExecuted: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationBePassed?: number;
  automationBeFailed?: number;
  automationFePassed?: number;
  automationFeFailed?: number;
  automationPassed?: number;
  automationFailed?: number;
};

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

export function calculateReportMetrics(input: ReportMetricsInput) {
  const totalTestCase = input.testCaseTotal ?? input.testCaseBeTotal + input.testCaseFeTotal;
  const totalExecutedTestCase = input.testCaseBeExecuted + input.testCaseFeExecuted;
  const automationBePassed = input.automationBePassed ?? 0;
  const automationBeFailed = input.automationBeFailed ?? 0;
  const automationFePassed = input.automationFePassed ?? 0;
  const automationFeFailed = input.automationFeFailed ?? 0;
  const totalAutomation = input.automationBeTotal + input.automationFeTotal;
  const splitAutomationRun = automationBePassed + automationBeFailed + automationFePassed + automationFeFailed;
  const legacyAutomationRun = (input.automationPassed ?? 0) + (input.automationFailed ?? 0);
  const totalAutomationRun = splitAutomationRun || legacyAutomationRun;
  const totalAutomationPassed = automationBePassed + automationFePassed || input.automationPassed ?? 0;

  return {
    totalTestCase,
    totalExecutedTestCase,
    totalAutomation,
    totalAutomationRun,
    automationCoverage: percent(totalAutomation, input.testCaseBeTotal + input.testCaseFeTotal),
    executionCoverage: percent(totalExecutedTestCase, input.testCaseBeTotal + input.testCaseFeTotal),
    automationPassRate: percent(totalAutomationPassed, totalAutomationRun),
    automationBeCoverage: percent(input.automationBeTotal, input.testCaseBeTotal),
    automationFeCoverage: percent(input.automationFeTotal, input.testCaseFeTotal),
    automationBePassRate: percent(automationBePassed, automationBePassed + automationBeFailed),
    automationFePassRate: percent(automationFePassed, automationFePassed + automationFeFailed),
  };
}
```

- [ ] **Step 4: Run green test**

Run: `npm test -- src/lib/reports/calculator.test.ts`

Expected: PASS.

---

### Task 2: Schema and Validation

**Files:**
- Modify: `src/db/schema.ts`
- Generate: `drizzle/*.sql`, `drizzle/meta/*`
- Modify: `src/lib/validations/weekly-report.test.ts`
- Modify: `src/lib/validations/weekly-report.ts`

- [ ] **Step 1: Write failing validation tests**

Update `validBase` in `src/lib/validations/weekly-report.test.ts` with:

```ts
testCaseTotal: 120,
automationBePassed: 45,
automationBeFailed: 5,
automationFePassed: 36,
automationFeFailed: 4,
```

Add tests:

```ts
it("rejects BE automation total exceeding BE test case total", () => {
  const result = weeklyReportSchema.safeParse({
    ...validBase,
    testCaseBeTotal: 10,
    automationBeTotal: 11,
  });
  expect(result.success).toBe(false);
});

it("rejects FE automation total exceeding FE test case total", () => {
  const result = weeklyReportSchema.safeParse({
    ...validBase,
    testCaseFeTotal: 10,
    automationFeTotal: 11,
  });
  expect(result.success).toBe(false);
});

it("rejects split automation runs exceeding automation totals", () => {
  const beResult = weeklyReportSchema.safeParse({
    ...validBase,
    automationBeTotal: 10,
    automationBePassed: 9,
    automationBeFailed: 2,
  });
  const feResult = weeklyReportSchema.safeParse({
    ...validBase,
    automationFeTotal: 10,
    automationFePassed: 9,
    automationFeFailed: 2,
  });

  expect(beResult.success).toBe(false);
  expect(feResult.success).toBe(false);
});

it("allows total test case lower than BE plus FE totals", () => {
  const result = weeklyReportSchema.safeParse({
    ...validBase,
    testCaseTotal: 100,
    testCaseBeTotal: 100,
    testCaseFeTotal: 40,
  });
  expect(result.success).toBe(true);
});
```

- [ ] **Step 2: Run red validation tests**

Run: `npm test -- src/lib/validations/weekly-report.test.ts`

Expected: FAIL because schema does not enforce split fields.

- [ ] **Step 3: Extend Drizzle schema**

In `src/db/schema.ts`, add fields around existing weekly report numeric fields:

```ts
testCaseTotal: integer("test_case_total").notNull().default(0),
automationBePassed: integer("automation_be_passed").notNull().default(0),
automationBeFailed: integer("automation_be_failed").notNull().default(0),
automationFePassed: integer("automation_fe_passed").notNull().default(0),
automationFeFailed: integer("automation_fe_failed").notNull().default(0),
automationBeCoverage: numeric("automation_be_coverage", { precision: 5, scale: 2 }),
automationFeCoverage: numeric("automation_fe_coverage", { precision: 5, scale: 2 }),
automationBePassRate: numeric("automation_be_pass_rate", { precision: 5, scale: 2 }),
automationFePassRate: numeric("automation_fe_pass_rate", { precision: 5, scale: 2 }),
```

- [ ] **Step 4: Generate migration**

Run: `npm run db:generate`

Expected: a new `drizzle/*.sql` migration adding the new columns and `drizzle/meta/*` updates.

- [ ] **Step 5: Implement validation schema**

In `src/lib/validations/weekly-report.ts`, add fields:

```ts
testCaseTotal: z.number().int().min(0).default(0),
automationBePassed: z.number().int().min(0).default(0),
automationBeFailed: z.number().int().min(0).default(0),
automationFePassed: z.number().int().min(0).default(0),
automationFeFailed: z.number().int().min(0).default(0),
```

Replace aggregate automation refine with:

```ts
.refine((data) => data.automationBeTotal <= data.testCaseBeTotal, {
  message: "Automation BE total cannot exceed BE test cases",
  path: ["automationBeTotal"],
})
.refine((data) => data.automationFeTotal <= data.testCaseFeTotal, {
  message: "Automation FE total cannot exceed FE test cases",
  path: ["automationFeTotal"],
})
.refine((data) => data.automationBePassed + data.automationBeFailed <= data.automationBeTotal, {
  message: "Automation BE run result cannot exceed Automation BE total",
  path: ["automationBePassed"],
})
.refine((data) => data.automationFePassed + data.automationFeFailed <= data.automationFeTotal, {
  message: "Automation FE run result cannot exceed Automation FE total",
  path: ["automationFePassed"],
})
```

- [ ] **Step 6: Run green validation tests**

Run: `npm test -- src/lib/validations/weekly-report.test.ts`

Expected: PASS.

---

### Task 3: Actions and Form State

**Files:**
- Modify: `src/lib/weekly-reports/form-state.test.ts`
- Modify: `src/lib/weekly-reports/form-state.ts`
- Modify: `src/lib/weekly-reports/actions.ts`

- [ ] **Step 1: Write failing form-state test**

In `src/lib/weekly-reports/form-state.test.ts`, add form fields and assertions:

```ts
formData.set("testCaseTotal", "120");
formData.set("automationBePassed", "45");
formData.set("automationBeFailed", "5");
formData.set("automationFePassed", "36");
formData.set("automationFeFailed", "4");

expect(weeklyReportDefaultsFromFormData(formData)).toMatchObject({
  testCaseTotal: "120",
  automationBePassed: "45",
  automationBeFailed: "5",
  automationFePassed: "36",
  automationFeFailed: "4",
});
```

- [ ] **Step 2: Run red form-state test**

Run: `npm test -- src/lib/weekly-reports/form-state.test.ts`

Expected: FAIL because new fields are not preserved.

- [ ] **Step 3: Preserve new form fields**

In `src/lib/weekly-reports/form-state.ts`, add type fields and defaults:

```ts
testCaseTotal?: string;
automationBePassed?: string;
automationBeFailed?: string;
automationFePassed?: string;
automationFeFailed?: string;
```

Add return properties:

```ts
testCaseTotal: value(formData, "testCaseTotal"),
automationBePassed: value(formData, "automationBePassed"),
automationBeFailed: value(formData, "automationBeFailed"),
automationFePassed: value(formData, "automationFePassed"),
automationFeFailed: value(formData, "automationFeFailed"),
```

- [ ] **Step 4: Parse/store new action fields**

In `src/lib/weekly-reports/actions.ts`, update `parseReportForm`:

```ts
testCaseTotal: num("testCaseTotal"),
automationBePassed: num("automationBePassed"),
automationBeFailed: num("automationBeFailed"),
automationFePassed: num("automationFePassed"),
automationFeFailed: num("automationFeFailed"),
automationPassed: num("automationBePassed") + num("automationFePassed"),
automationFailed: num("automationBeFailed") + num("automationFeFailed"),
```

Update `coverageValues`:

```ts
return {
  automationCoverage: String(metrics.automationCoverage),
  executionCoverage: String(metrics.executionCoverage),
  automationBeCoverage: String(metrics.automationBeCoverage),
  automationFeCoverage: String(metrics.automationFeCoverage),
  automationBePassRate: String(metrics.automationBePassRate),
  automationFePassRate: String(metrics.automationFePassRate),
};
```

- [ ] **Step 5: Run green form-state test**

Run: `npm test -- src/lib/weekly-reports/form-state.test.ts`

Expected: PASS.

---

### Task 4: Weekly Form UX

**Files:**
- Modify: `src/components/reports/weekly-report-form.tsx`
- Modify: `src/app/(dashboard)/weekly-reports/[id]/edit/page.tsx`

- [ ] **Step 1: Add form default types**

In `WeeklyReportDefaults`, add:

```ts
testCaseTotal?: number | string;
automationBePassed?: number | string;
automationBeFailed?: number | string;
automationFePassed?: number | string;
automationFeFailed?: number | string;
```

- [ ] **Step 2: Improve Test case card**

Replace Test case section fields with:

```tsx
<FormSection title="Test case" description="Total unique test case dan cakupan BE/FE.">
  <div className="grid gap-4 sm:grid-cols-3">
    <NumberField name="testCaseTotal" label="Test case total" defaultValue={values.testCaseTotal} />
    <NumberField name="testCaseBeTotal" label="Test case BE total" defaultValue={values.testCaseBeTotal} />
    <NumberField name="testCaseFeTotal" label="Test case FE total" defaultValue={values.testCaseFeTotal} />
  </div>
</FormSection>
```

- [ ] **Step 3: Improve Automation card with BE/FE groups**

Replace Automation section with:

```tsx
<FormSection title="Automation" description="Coverage dan hasil run automation per platform.">
  <div className="grid gap-4 lg:grid-cols-2">
    <div className="rounded-lg border border-border/70 p-3">
      <h4 className="text-sm font-medium">Backend</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <NumberField name="automationBeTotal" label="BE total" defaultValue={values.automationBeTotal} />
        <NumberField name="automationBePassed" label="BE passed" defaultValue={values.automationBePassed} />
        <NumberField name="automationBeFailed" label="BE failed" defaultValue={values.automationBeFailed} />
      </div>
    </div>
    <div className="rounded-lg border border-border/70 p-3">
      <h4 className="text-sm font-medium">Frontend</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <NumberField name="automationFeTotal" label="FE total" defaultValue={values.automationFeTotal} />
        <NumberField name="automationFePassed" label="FE passed" defaultValue={values.automationFePassed} />
        <NumberField name="automationFeFailed" label="FE failed" defaultValue={values.automationFeFailed} />
      </div>
    </div>
  </div>
</FormSection>
```

- [ ] **Step 4: Add edit defaults**

In `src/app/(dashboard)/weekly-reports/[id]/edit/page.tsx`, add defaults:

```ts
testCaseTotal: report.testCaseTotal,
automationBePassed: report.automationBePassed,
automationBeFailed: report.automationBeFailed,
automationFePassed: report.automationFePassed,
automationFeFailed: report.automationFeFailed,
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

---

### Task 5: Weekly Detail Output

**Files:**
- Modify: `src/app/(dashboard)/weekly-reports/[id]/page.tsx`

- [ ] **Step 1: Update weekly detail metric layout**

Replace the report detail metric grid with cards using:

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Metric label="Total test case" value={metrics.totalTestCase} />
  <Metric label="BE test case" value={report.testCaseBeTotal} />
  <Metric label="FE test case" value={report.testCaseFeTotal} />
  <Metric label="BE automation coverage" value={`${metrics.automationBeCoverage}%`} />
  <Metric label="FE automation coverage" value={`${metrics.automationFeCoverage}%`} />
  <Metric label="BE pass rate" value={`${metrics.automationBePassRate}%`} />
  <Metric label="FE pass rate" value={`${metrics.automationFePassRate}%`} />
  <Metric label="Total automation" value={metrics.totalAutomation} />
</div>
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

---

### Task 6: Monthly and Dashboard Reporting

**Files:**
- Modify: `src/lib/monthly-reports/aggregate.test.ts`
- Modify: `src/lib/monthly-reports/aggregate.ts`
- Modify: `src/lib/monthly-reports/queries.ts`
- Modify: `src/components/monthly-reports/monthly-summary.tsx`
- Modify: `src/lib/monthly-reports/export-markdown.test.ts`
- Modify: `src/lib/monthly-reports/export-markdown.ts`
- Modify: `src/lib/dashboard/queries.ts`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Write failing monthly aggregate tests**

In monthly test rows, add:

```ts
testCaseTotal: 120,
automationBeCoverage: "40.00",
automationFeCoverage: "37.50",
automationBePassRate: "90.00",
automationFePassRate: "80.00",
```

Assert summary fields:

```ts
expect(summary.testCaseTotal).toBe(240);
expect(summary.avgAutomationBe).toBe(45);
expect(summary.avgAutomationFe).toBe(43.75);
expect(summary.avgAutomationBePassRate).toBe(90);
expect(summary.avgAutomationFePassRate).toBe(80);
```

- [ ] **Step 2: Run red monthly aggregate tests**

Run: `npm test -- src/lib/monthly-reports/aggregate.test.ts`

Expected: FAIL because summary fields are missing.

- [ ] **Step 3: Implement monthly aggregate fields**

Update `MonthlyRow` and `summarizeMonthlyReports` with fields:

```ts
testCaseTotal: number;
automationBeCoverage: string | null;
automationFeCoverage: string | null;
automationBePassRate: string | null;
automationFePassRate: string | null;
```

Return fields:

```ts
testCaseTotal: reports.reduce((acc, r) => acc + r.testCaseTotal, 0),
avgAutomationBe: average(automationBeValues),
avgAutomationFe: average(automationFeValues),
avgAutomationBePassRate: average(automationBePassRateValues),
avgAutomationFePassRate: average(automationFePassRateValues),
```

- [ ] **Step 4: Update monthly query**

In `src/lib/monthly-reports/queries.ts`, select sums/averages:

```ts
testCaseTotal: sum(weeklyReports.testCaseTotal),
avgAutomationBe: avg(weeklyReports.automationBeCoverage),
avgAutomationFe: avg(weeklyReports.automationFeCoverage),
avgAutomationBePassRate: avg(weeklyReports.automationBePassRate),
avgAutomationFePassRate: avg(weeklyReports.automationFePassRate),
```

Return numbers:

```ts
testCaseTotal: Number(totals?.testCaseTotal ?? 0),
avgAutomationBe: totals?.avgAutomationBe ? Number(totals.avgAutomationBe) : 0,
avgAutomationFe: totals?.avgAutomationFe ? Number(totals.avgAutomationFe) : 0,
avgAutomationBePassRate: totals?.avgAutomationBePassRate ? Number(totals.avgAutomationBePassRate) : 0,
avgAutomationFePassRate: totals?.avgAutomationFePassRate ? Number(totals.avgAutomationFePassRate) : 0,
```

- [ ] **Step 5: Update monthly UI and export**

In `monthly-summary.tsx`, show:

```tsx
<Metric label="Test case total" value={summary.testCaseTotal} />
<Metric label="Avg BE coverage" value={`${summary.avgAutomationBe.toFixed(2)}%`} />
<Metric label="Avg FE coverage" value={`${summary.avgAutomationFe.toFixed(2)}%`} />
<Metric label="Avg BE pass rate" value={`${summary.avgAutomationBePassRate.toFixed(2)}%`} />
<Metric label="Avg FE pass rate" value={`${summary.avgAutomationFePassRate.toFixed(2)}%`} />
```

In `export-markdown.ts`, replace generic automation coverage with:

```ts
`| Test Case Total | ${summary.testCaseTotal} |`,
`| Automation BE Coverage | ${summary.avgAutomationBe.toFixed(2)}% |`,
`| Automation FE Coverage | ${summary.avgAutomationFe.toFixed(2)}% |`,
`| Automation BE Pass Rate | ${summary.avgAutomationBePassRate.toFixed(2)}% |`,
`| Automation FE Pass Rate | ${summary.avgAutomationFePassRate.toFixed(2)}% |`,
```

- [ ] **Step 6: Update dashboard query and UI**

In `src/lib/dashboard/queries.ts`, change `listCoverageByProject` select:

```ts
avgAutomationBe: avg(weeklyReports.automationBeCoverage),
avgAutomationFe: avg(weeklyReports.automationFeCoverage),
reportCount: count(),
```

In `dashboard/page.tsx`, render:

```tsx
BE {formatPercent(row.avgAutomationBe)} · FE {formatPercent(row.avgAutomationFe)}
```

- [ ] **Step 7: Run reporting tests**

Run: `npm test -- src/lib/monthly-reports/aggregate.test.ts src/lib/monthly-reports/export-markdown.test.ts`

Expected: PASS.

---

### Task 7: Final Verification

**Files:**
- All modified files.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 2: Lint**

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 3: Full tests**

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: build completes with exit 0.

- [ ] **Step 5: Manual DB migration note**

If the dev DB has not received the generated migration, run:

```bash
npm run db:migrate
```

Expected: migration applies new weekly report columns.

---

## Self-Review

- Spec coverage: form UX, data model, validation, metrics, weekly output, monthly/dashboard/export, and tests are covered by Tasks 1-7.
- Placeholder scan: no TBD/TODO/fill-later instructions.
- Type consistency: canonical new names are `testCaseTotal`, `automationBePassed`, `automationBeFailed`, `automationFePassed`, `automationFeFailed`, `automationBeCoverage`, `automationFeCoverage`, `automationBePassRate`, `automationFePassRate`.
