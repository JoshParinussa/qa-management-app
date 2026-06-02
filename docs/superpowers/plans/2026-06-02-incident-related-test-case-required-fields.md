# Incident Related Test Case And Required Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track related test case IDs for production incidents, mark required fields with `*`, validate them with Zod, and remove BE/FE executed test case inputs.

**Architecture:** Extend the existing JSON incident payload with `relatedTestCaseId`. Keep old incident payloads readable by defaulting missing related IDs to an empty string, and add Zod conditional validation when `productionIncidentCount > 0`.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Vitest.

---

### Task 1: Incident Data And Validation

**Files:**
- Modify: `src/lib/reports/incidents.ts`
- Modify: `src/lib/reports/incidents.test.ts`
- Modify: `src/lib/validations/weekly-report.ts`
- Modify: `src/lib/validations/weekly-report.test.ts`

- [ ] Add failing tests for `relatedTestCaseId` parsing and backward compatibility.
- [ ] Add failing Zod tests for missing incident related test case IDs.
- [ ] Implement incident parsing defaults and Zod `superRefine` validation.
- [ ] Run targeted tests.

### Task 2: Form UI

**Files:**
- Modify: `src/components/reports/weekly-report-form.tsx`
- Modify: `src/components/ui/incident-list-input.tsx`

- [ ] Add reusable required label mark.
- [ ] Mark required fields with `*`.
- [ ] Add `Related test case ID *` to each production incident card.
- [ ] Remove `Test case BE executed` and `Test case FE executed` inputs.
- [ ] Keep server-submitted executed values at `0`.

### Task 3: Detail And Report Output

**Files:**
- Modify: `src/app/(dashboard)/weekly-reports/[id]/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/components/monthly-reports/monthly-summary.tsx`
- Modify: `src/lib/monthly-reports/export-markdown.ts`

- [ ] Display related test case ID on incident detail cards.
- [ ] Remove executed/Execution coverage UI from report detail, dashboard, monthly summary, and Markdown export.

### Task 4: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
