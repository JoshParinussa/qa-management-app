# Number Placeholders And Incident Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make new numeric fields blank with `0` as placeholder, and sync production incident cards with the incident count.

**Architecture:** Keep numeric submit parsing unchanged because blank submits already become `0`. Add small incident count helpers in the report incident module, then wire weekly report form state to `IncidentListInput`.

**Tech Stack:** React, Next.js App Router, TypeScript, Vitest.

---

### Task 1: Incident Count Helpers

**Files:**
- Modify: `src/lib/reports/incidents.ts`
- Test: `src/lib/reports/incidents.test.ts`

- [ ] Write failing tests for parsing blank/invalid/count strings.
- [ ] Write failing tests for expanding/trimming incident item arrays to a count.
- [ ] Implement `parseIncidentCountInput` and `syncIncidentItemsToCount`.
- [ ] Run targeted tests.

### Task 2: Weekly Report Form Numbers

**Files:**
- Modify: `src/components/reports/weekly-report-form.tsx`

- [ ] Change `NumberField` default from `defaultValue ?? 0` to blank when default is undefined.
- [ ] Add `placeholder="0"` to all number inputs.
- [ ] Make production incident count controlled in `WeeklyReportForm`.

### Task 3: Incident List Sync

**Files:**
- Modify: `src/components/ui/incident-list-input.tsx`

- [ ] Accept `count` and `onCountChange` props.
- [ ] Auto-expand/trim cards when count changes.
- [ ] Keep Add incident and Remove incident synced with count.

### Task 4: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
