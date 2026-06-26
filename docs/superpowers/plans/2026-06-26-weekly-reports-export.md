# Weekly Reports Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Markdown export of approved weekly reports, filterable by date range and optionally by project, on the Weekly reports page.

**Architecture:** Mirror the existing monthly export: a GET route handler resolves the user/permission, parses the date range and optional projectId, calls a query that returns full approved report rows, then a Markdown builder renders each report's detail. UI reuses the dashboard `DateRangeFilter` driven by URL search params plus a project dropdown and a download link.

**Tech Stack:** Next.js 16 App Router route handlers, Drizzle ORM, React server/client components, Vitest.

---

## File Structure

- Create `src/lib/weekly-reports/export-markdown.ts` — `buildWeeklyReportsMarkdown(...)` + `weeklyExportFilename(...)`. Pure functions, no DB.
- Create `src/lib/weekly-reports/export-markdown.test.ts` — unit tests for the builder.
- Modify `src/lib/weekly-reports/queries.ts` — add `listApprovedReportsForExport(...)` and `listProjectsForExportFilter()`.
- Modify `src/lib/weekly-reports/queries.test.ts` — add `.toSQL()` assertions for the new query.
- Create `src/app/api/weekly-reports/export/route.ts` — GET handler.
- Create `src/components/reports/export-weekly-controls.tsx` — client component (project select + date range + download).
- Modify `src/app/(dashboard)/weekly-reports/page.tsx` — render export controls for users with `report:export`.

---

### Task 1: Markdown builder + tests

**Files:**
- Create: `src/lib/weekly-reports/export-markdown.ts`
- Test: `src/lib/weekly-reports/export-markdown.test.ts`

The builder is a pure function over an array of report rows (shape = `WeeklyReportExportRow` from Task 2). It must not touch the DB. Reuse `calculateReportMetrics` (`@/lib/reports/calculator`), `parseBulletItems`/`formatMarkdownBullet` (`@/lib/reports/bullets`), `parseIncidents` (`@/lib/reports/incidents`), `formatReportDate` (`@/lib/reports/format`).

- [ ] Step 1: Write `export-markdown.test.ts` covering: header includes scope name + period; per-report `###` heading with project + week dates; metrics table values from `calculateReportMetrics`; blocker/next-plan bullets; "Tidak ada blocker." when empty; incidents rendered with title/description; empty `reports` yields `## Reports (0)` + "Tidak ada approved report pada periode ini."; `weeklyExportFilename` slugging (project => `name-from-to-to.md`, undefined => `all-projects-from-to-to.md`).
- [ ] Step 2: Run `npm test -- export-markdown` — expect FAIL (module not found).
- [ ] Step 3: Implement `buildWeeklyReportsMarkdown({ from, to, projectName, reports })` and `weeklyExportFilename(projectName, from, to)`.
- [ ] Step 4: Run `npm test -- export-markdown` — expect PASS.
- [ ] Step 5: Commit.

### Task 2: Query functions + tests

**Files:**
- Modify: `src/lib/weekly-reports/queries.ts`
- Test: `src/lib/weekly-reports/queries.test.ts`

`listApprovedReportsForExport({ start, end, projectId? })`: select full weeklyReports detail fields + `projects.name` + reviewer/approver names (alias joins like `listAllReports`), WHERE `status = 'APPROVED'` AND `weekStartDate <= end` AND `weekEndDate >= start`, plus `projectId` eq when provided; ORDER BY `projects.name`, `weeklyReports.weekStartDate`. Export `WeeklyReportExportRow` type. `listProjectsForExportFilter()`: all projects `{id, name}` ordered by name.

- [ ] Step 1: Add `.toSQL()` test: query contains `"status" = 'APPROVED'`, the overlap conditions, and (with projectId) `"project_id" = $`.
- [ ] Step 2: Run `npm test -- queries` — expect FAIL.
- [ ] Step 3: Implement both functions.
- [ ] Step 4: Run `npm test -- queries` + `npm run typecheck` — expect PASS.
- [ ] Step 5: Commit.

### Task 3: API route handler

**Files:**
- Create: `src/app/api/weekly-reports/export/route.ts`

Pattern mirrors `src/app/api/monthly-reports/export/route.ts`. `requireUser()`; `can(role, "report:export")` else 403. `parseDashboardDateRange(from, to)` for range. Optional `projectId`. Resolve project name via `listProjectsForExportFilter()`. Return markdown with `text/markdown` + attachment disposition.

- [ ] Step 1: Implement route.
- [ ] Step 2: `npm run typecheck` + `npm run lint` — expect PASS.
- [ ] Step 3: Commit.

### Task 4: UI controls + page wiring

**Files:**
- Create: `src/components/reports/export-weekly-controls.tsx`
- Modify: `src/app/(dashboard)/weekly-reports/page.tsx`

Client component: project `Select` (All projects + list) + reuse `DateRangeFilter` + download `<a>` to `/api/weekly-reports/export?from&to&projectId`, all driven by URL search params (project select calls `router.push` updating `projectId`). Page: read `searchParams` (`from`,`to`,`projectId`), compute defaults via `parseDashboardDateRange`, fetch `listProjectsForExportFilter()` and render controls only when `can(user.role, "report:export")`.

- [ ] Step 1: Implement component + wire page.
- [ ] Step 2: `npm run typecheck` + `npm run lint` — expect PASS.
- [ ] Step 3: Commit.

### Task 5: Full verification

- [ ] `npm run typecheck && npm run lint && npm test` all green.
- [ ] Manual: as QA_LEAD pick range+project, download, inspect markdown; confirm QA_MEMBER has no control and endpoint 403s.



