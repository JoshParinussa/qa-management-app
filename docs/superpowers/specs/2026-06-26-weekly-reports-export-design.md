# Weekly Reports Export — Design

Date: 2026-06-26
Branch: `feat/weekly-reports-export`

## Problem

Users need to export weekly reports to Markdown, in two modes:

1. **Per project** — all approved weekly reports for one project within a date range.
2. **All projects** — all approved weekly reports across every project within a date range.

The existing monthly export aggregates approved reports into a single summary. This new feature instead renders the **full detail of each individual report**, so it serves as an archive / shareable record rather than a roll-up.

## Decisions (from brainstorming)

- **Axis**: date range (`from`–`to`), not a single fixed week. `projectId` optional — present = per-project mode, absent = all-projects mode. Mirrors the monthly export's optional-`projectId` pattern.
- **Output**: full detail of each report, rendered sequentially.
- **Status filter**: `APPROVED` only, consistent with monthly export. Draft/pending reports never leak into output.
- **UI location**: on the existing Weekly reports page.
- **Project dropdown**: lists **all** projects (including ARCHIVED), because an approved historical report may belong to an archived project; restricting to ACTIVE would make those reports un-exportable.
- **Access**: gated by `report:export` permission (ADMIN + QA_LEAD). QA_MEMBER does not see the export controls and is blocked at the API.

## Approach

Reuse the monthly-export shape: **route handler → query → Markdown builder → download via `<a>`**. Proven, consistent, low-risk.

### 1. Endpoint

`GET /api/weekly-reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD&projectId=<optional>`

`src/app/api/weekly-reports/export/route.ts`

- `requireUser()`; if `!can(user.role, "report:export")` → `403`.
- Parse range with `parseDashboardDateRange(from, to)` (reuses existing validation, WIB-aware defaults, and from>to normalization). This yields `{ from, to, start, end }`.
- `projectId` from query (optional).
- Call `listApprovedReportsForExport({ range, projectId })`.
- Resolve `projectName` for filename/header: if `projectId`, look it up via the project filter query; else `"All projects"`.
- Build Markdown + filename, return with `Content-Type: text/markdown; charset=utf-8` and `Content-Disposition: attachment`.

### 2. Query

`src/lib/weekly-reports/queries.ts` — new `listApprovedReportsForExport({ range, projectId })`

- Select the full `weeklyReports` row fields needed for detail rendering, plus `projects.name`, reviewer name, approver name (alias joins, same pattern as `listAllReports`).
- WHERE: `status = 'APPROVED'` AND range overlap. Use the same overlap semantics as the dashboard: `weekStartDate <= range.end AND weekEndDate >= range.start`. (A report whose week intersects the selected range is included.)
- If `projectId` present, add `eq(weeklyReports.projectId, projectId)`.
- ORDER BY `projects.name`, then `weeklyReports.weekStartDate`.

New `listProjectsForExportFilter()` — all projects (id, name), ordered by name, no status filter. (Distinct from `listActiveProjectsForFilter` which the monthly export uses.)

Return type exported as `WeeklyReportExportRow` for the builder.

### 3. Markdown builder

`src/lib/weekly-reports/export-markdown.ts`

`buildWeeklyReportsMarkdown({ from, to, projectName, reports })`:

```
# Weekly QA Reports

## Scope
<projectName>

## Period
<from> – <to>

## Reports (<count>)

<for each report:>
### <projectName> — <weekStart> → <weekEnd>
- Status: Approved
- Reviewed by: <name | —>
- Approved by: <name | —>

#### Summary
<bullets>

#### Metrics
| Metric | Value |
|---|---:|
| Total test case | n |
| Total automated | n |
| BE test case | n |
| BE automated | n |
| BE automation coverage | x% |
| BE pass rate | x% |
| FE test case | n |
| FE automated | n |
| FE automation coverage | x% |
| FE pass rate | x% |

#### Production incidents (<count>)
<incidents list, or "Tidak ada production incident.">
Bug document: <url, if present>

#### Blocker
<bullets, or "- Tidak ada blocker.">

#### Next week plan
<bullets>

#### Notes
<notes, or "-">

---
```

- Metrics computed via `calculateReportMetrics(report)` — same function the detail page uses, so numbers match the UI rather than trusting only stored columns.
- Bullets via `parseBulletItems` + `formatMarkdownBullet`.
- Incidents via `parseIncidents`; render each as a bullet with title / related test case id / description.
- Dates via `formatReportDate` (UTC, date-only — consistent with stored week dates).
- Empty `reports` → still emit header with `## Reports (0)` and a "Tidak ada approved report pada periode ini." line.

`weeklyExportFilename(projectName | undefined, from, to)`:
- Slugify project name (or `all-projects`), append `-<from>-to-<to>.md`.
- e.g. `payment-gateway-2026-06-01-to-2026-06-26.md`.

### 4. UI

`src/components/reports/export-weekly-button.tsx` (client component):
- Inputs: project dropdown (all projects, plus "All projects" option) + date range (reuse `DateRangeFilter` from dashboard, driven by URL search params) + Download button.
- Decision: drive `from`/`to`/`projectId` through URL search params (same mechanism `DateRangeFilter` already uses), and the Download button is an `<a>` to the export endpoint built from current params. This avoids duplicating the calendar UI.

`src/app/(dashboard)/weekly-reports/page.tsx`:
- Read `searchParams` for `from`, `to`, `projectId`.
- Compute range defaults via `parseDashboardDateRange`.
- If `can(user.role, "report:export")`, fetch `listProjectsForExportFilter()` and render the export controls (in the `PageHeader` action slot or a small filter card). Otherwise unchanged.

### 5. Tests

- `src/lib/weekly-reports/export-markdown.test.ts`: builder happy path (per-project + all-projects), empty reports, incidents present/absent, blocker empty, filename slugging.
- Query filter behavior is covered indirectly; if the existing `queries.test.ts` has a DB harness, add a case for status + range + projectId filtering. Otherwise keep query logic thin and rely on the builder tests + manual verification.

## Out of scope

- PDF/CSV/XLSX export (Markdown only, matching monthly).
- Non-approved statuses.
- Async/background generation (reports volume is small; synchronous is fine).

## Verification

`npm run typecheck && npm run lint && npm test`, then manual: load Weekly reports page as QA_LEAD, pick range + project, download, inspect Markdown. Confirm QA_MEMBER sees no export control and the endpoint returns 403 for them.
