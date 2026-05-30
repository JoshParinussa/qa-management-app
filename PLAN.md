# QA Management App Implementation Plan

> **For agentic workers:** implement phase-by-phase. Use TDD for business logic and validation. Run verification after every phase.

**Goal:** Build the QA Management App MVP from the current Drizzle + Next.js foundation into a complete internal QA workflow system.

**Architecture:** Next.js App Router full-stack with Server Actions for mutations, Drizzle ORM for PostgreSQL, Zod for validation, Vitest for unit tests, and Playwright E2E per phase. Keep domain logic in `src/lib/*`, database definitions in `src/db/*`, and UI in focused route/component files.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn-style UI components, Drizzle ORM, PostgreSQL, Zod, bcryptjs, Vitest, Playwright.

---

## Status Legend

| Status | Meaning |
|---|---|
| DONE | Completed and verified |
| IN PROGRESS | Started but not complete |
| TO DO | Planned, not started |
| DROP | Out of MVP scope |

## Complexity Legend

| Value | Meaning |
|---:|---|
| 1 | Very easy, isolated, low risk |
| 2-3 | Small feature/helper |
| 4-5 | Medium feature with DB/UI interaction |
| 6-7 | Larger workflow or multi-file feature |
| 8-10 | Complex workflow, many rules, high regression risk |

---

## Decisions Locked

| Decision | Value |
|---|---|
| Project CRUD UX | Dedicated routes, not modal-only |
| User reset password | Generate new random password, show once to admin, set `must_change_password=true` |
| Weekly report uniqueness | One report per project/user/week |
| E2E tests | Required per phase, happy path minimum |
| ORM | Drizzle only |
| DB | Homeserver PostgreSQL, Tailscale first, LAN fallback |
| Primary keys | UUID v7 (app-generated via `uuidv7`), sortable by timestamp |
| Tables | All list tables use reusable `DataTable` (TanStack Table) with sorting + pagination |
| Dashboard | Role-aware (Lead/Admin vs Member); no dummy chart/data, only QA-relevant stats |

---

## Phase Summary

| Phase | Goal | Status | Complexity |
|---|---|---|---:|
| 0 | DB ready | DONE | 5 |
| 1 | Auth + admin create user + first-login change password | DONE | 6 |
| 2 | Project CRUD | DONE | 5 |
| 3 | User CRUD lanjutan | DONE | 5 |
| 4 | Project member assignment | DONE | 5 |
| 5 | Weekly report CRUD | DONE | 8 |
| 6 | Submit flow | DONE | 4 |
| 7 | Review flow | DONE | 6 |
| 8 | Dashboard summary | DONE | 6 |
| 9 | Monthly summary | DONE | 6 |
| 10 | Markdown export | DONE | 4 |
| 11 | Hardening | DONE | 5 |
| 12 | Test baseline | DONE | 5 |

---

## Phase 0 — DB Ready

**Status:** DONE  
**Complexity:** 5

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 0.1 | Install and configure Drizzle ORM | DONE | 3 |
| 0.2 | Remove Prisma packages and project files | DONE | 3 |
| 0.3 | Create `src/db/schema.ts` | DONE | 4 |
| 0.4 | Create `src/db/client.ts` | DONE | 3 |
| 0.5 | Create `drizzle.config.ts` | DONE | 2 |
| 0.6 | Create Tailscale-to-LAN DB resolver | DONE | 4 |
| 0.7 | Create homeserver DB reset script | DONE | 3 |
| 0.8 | Generate initial Drizzle migration | DONE | 2 |
| 0.9 | Apply migration to homeserver DB | DONE | 2 |
| 0.10 | Create Drizzle seed script | DONE | 3 |
| 0.11 | Add Drizzle Studio script | DONE | 2 |
| 0.12 | Inject resolved `DATABASE_URL` into `dev`, `build`, and `start` | DONE | 2 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 0.T1 | Run `npm run db:resolve` and verify Tailscale/LAN selection | DONE | 1 |
| 0.T2 | Run `npm run db:migrate` | DONE | 2 |
| 0.T3 | Run `npm run db:seed` | DONE | 2 |
| 0.T4 | Run `npm run db:studio` and verify Studio opens | DONE | 2 |
| 0.T5 | Run `npm run typecheck`, `npm run lint`, `npm run build` | DONE | 2 |

### Acceptance Criteria

- Drizzle is the only ORM.
- Prisma files and dependencies are removed.
- DB can be reached through resolver.
- Migrations apply cleanly.
- Seed data inserts admin/member/project records.

---

## Phase 1 — Auth + Admin Create User + First-Login Password Change

**Status:** DONE  
**Complexity:** 6

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 1.1 | Add `users.must_change_password` | DONE | 2 |
| 1.2 | Create bcrypt hash/verify helpers | DONE | 2 |
| 1.3 | Create HMAC signed session cookie helpers | DONE | 5 |
| 1.4 | Create `loginAction` | DONE | 4 |
| 1.5 | Create `logoutAction` | DONE | 2 |
| 1.6 | Create `changePasswordAction` | DONE | 4 |
| 1.7 | Create `requireUser` and `requireAdmin` guards | DONE | 3 |
| 1.8 | Build login page/form | DONE | 3 |
| 1.9 | Build change password page/form | DONE | 3 |
| 1.10 | Protect dashboard layout | DONE | 3 |
| 1.11 | Build admin create user UI | DONE | 3 |
| 1.12 | Add default password env support | DONE | 2 |
| 1.13 | Build profile page | DONE | 3 |
| 1.14 | Build topbar profile dropdown and logout | DONE | 4 |
| 1.15 | Build shadcn-style app shell/sidebar | DONE | 4 |
| 1.16 | Fix unauthenticated dashboard redirect | DONE | 2 |
| 1.17 | Fix browser extension hydration warning | DONE | 1 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 1.T1 | Unit test post-login redirect helper | DONE | 2 |
| 1.T2 | Unit test password validation helper | DONE | 2 |
| 1.T3 | Unit test initials and role label helpers | DONE | 2 |
| 1.T4 | Unit test report status title-case labels | DONE | 2 |
| 1.T5 | E2E login admin happy path | DONE | 5 |
| 1.T6 | E2E admin create user happy path | DONE | 6 |
| 1.T7 | E2E first-login password change happy path | DONE | 6 |

### Acceptance Criteria

- Admin can login.
- Admin can create users.
- Created users receive a default password.
- Created users must change password on first login.
- Users can login with the new password afterward.
- Dashboard redirects unauthenticated users to `/login`.

---

## Phase 2 — Project CRUD

**Status:** DONE  
**Complexity:** 5

### Files

- Create `src/lib/projects/queries.ts`
- Create `src/lib/projects/actions.ts`
- Create `src/app/(dashboard)/projects/new/page.tsx`
- Create `src/app/(dashboard)/projects/[id]/page.tsx`
- Create `src/app/(dashboard)/projects/[id]/edit/page.tsx`
- Create `src/components/projects/project-form.tsx`
- Create `src/components/projects/project-table.tsx`
- Modify `src/app/(dashboard)/projects/page.tsx`
- Modify `src/lib/permissions/roles.ts`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 2.1 | Create `listProjects()` query ordered by created date | DONE | 2 |
| 2.2 | Create `getProjectById(id)` query | DONE | 2 |
| 2.3 | Create `createProjectAction` | DONE | 4 |
| 2.4 | Create `updateProjectAction` | DONE | 4 |
| 2.5 | Create `archiveProjectAction` | DONE | 3 |
| 2.6 | Map unique code DB error to readable error | DONE | 3 |
| 2.7 | Add `canManageProjects` permission helper | DONE | 3 |
| 2.8 | Build `/projects` table page | DONE | 4 |
| 2.9 | Build `/projects/new` dedicated route | DONE | 4 |
| 2.10 | Build `/projects/[id]` detail route | DONE | 4 |
| 2.11 | Build `/projects/[id]/edit` dedicated route | DONE | 4 |
| 2.12 | Add active/archived status UI | DONE | 3 |
| 2.13 | Add empty state for no projects | DONE | 1 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 2.T1 | Unit test `projectSchema` valid payload | DONE | 2 |
| 2.T2 | Unit test `projectSchema` rejects invalid code | DONE | 2 |
| 2.T3 | Unit test `canManageProjects` allows ADMIN/QA_LEAD | DONE | 3 |
| 2.T4 | Unit test `canManageProjects` blocks QA_MEMBER | DONE | 3 |
| 2.T5 | E2E create project happy path | DONE | 6 |
| 2.T6 | E2E edit project happy path | DONE | 6 |
| 2.T7 | E2E archive project happy path | DONE | 5 |

### Acceptance Criteria

- Admin and QA Lead can create, edit, and archive projects.
- QA Member cannot mutate projects.
- Project code is unique.
- Archived projects are visible but visually distinct.

---

## Phase 3 — User CRUD Lanjutan

**Status:** DONE  
**Complexity:** 5

### Files

- Modify `src/lib/users/actions.ts`
- Modify `src/lib/users/queries.ts`
- Create `src/app/(dashboard)/users/[id]/edit/page.tsx`
- Create `src/app/(dashboard)/users/[id]/reset-password/page.tsx`
- Create `src/components/users/user-table.tsx`
- Create `src/components/users/user-form.tsx`
- Create `src/components/users/reset-password-result.tsx`
- Modify `src/app/(dashboard)/users/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 3.1 | Create `getUserById(id)` query | DONE | 2 |
| 3.2 | Create `updateUserAction` for name/email/role/isActive | DONE | 4 |
| 3.3 | Create `deactivateUserAction` | DONE | 3 |
| 3.4 | Create `generateRandomPassword()` helper | DONE | 3 |
| 3.5 | Create `resetPasswordAction` that generates a new password | DONE | 5 |
| 3.6 | Set `must_change_password=true` on reset | DONE | 2 |
| 3.7 | Show generated password once to admin after reset | DONE | 5 |
| 3.8 | Prevent self-deactivate if user is last active admin | DONE | 4 |
| 3.9 | Build user table with actions | DONE | 4 |
| 3.10 | Build dedicated edit user route | DONE | 4 |
| 3.11 | Build reset password panel (in edit route) | DONE | 4 |
| 3.12 | Add filter by role/status | TO DO | 3 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 3.T1 | Unit test user schema valid/invalid payloads | DONE | 2 |
| 3.T2 | Unit test random generated password length and entropy format | DONE | 3 |
| 3.T3 | Unit test reset password sets `must_change_password=true` | DONE | 4 |
| 3.T4 | Unit test reset password does not equal default password | DONE | 3 |
| 3.T5 | Unit test last-admin deactivation rule | DONE | 4 |
| 3.T6 | E2E edit user happy path | DONE | 6 |
| 3.T7 | E2E reset password happy path | DONE | 7 |

### Acceptance Criteria

- Admin can edit users.
- Admin can deactivate users.
- Admin can reset password with a generated password.
- Reset password is shown only once after reset.
- Reset user must change password on next login.

---

## Phase 4 — Project Member Assignment

**Status:** DONE  
**Complexity:** 5

### Files

- Create `src/lib/project-members/queries.ts`
- Create `src/lib/project-members/actions.ts`
- Create `src/components/projects/project-member-form.tsx`
- Create `src/components/projects/project-member-table.tsx`
- Modify `src/app/(dashboard)/projects/[id]/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 4.1 | Query active members by project | DONE | 2 |
| 4.2 | Query available QA users for assignment | DONE | 3 |
| 4.3 | Create `assignMemberAction` | DONE | 4 |
| 4.4 | Create `removeMemberAction` using `removed_at` | DONE | 3 |
| 4.5 | Prevent duplicate active assignment | DONE | 3 |
| 4.6 | Preserve removed member history | DONE | 3 |
| 4.7 | Build assign member form | DONE | 4 |
| 4.8 | Build project member table | DONE | 3 |
| 4.9 | Add member section to project detail page | DONE | 3 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 4.T1 | Unit test duplicate assignment prevention | DONE | 3 |
| 4.T2 | Unit test remove sets `removed_at` | DONE | 3 |
| 4.T3 | Unit test removed member cannot create new report | DONE | 4 |
| 4.T4 | E2E assign member happy path | DONE | 6 |
| 4.T5 | E2E remove member happy path | DONE | 6 |

### Acceptance Criteria

- Admin and QA Lead can assign members.
- Removed members are soft removed.
- History remains available.

---

## Phase 5 — Weekly Report CRUD

**Status:** DONE  
**Complexity:** 8

### Files

- Create `src/lib/weekly-reports/queries.ts`
- Create `src/lib/weekly-reports/actions.ts`
- Modify `src/lib/reports/calculator.ts`
- Modify `src/lib/validations/weekly-report.ts`
- Create `src/components/reports/weekly-report-form.tsx`
- Create `src/components/reports/weekly-report-table.tsx`
- Create `src/components/reports/report-metrics.tsx`
- Modify `src/app/(dashboard)/weekly-reports/page.tsx`
- Create `src/app/(dashboard)/weekly-reports/new/page.tsx`
- Create `src/app/(dashboard)/weekly-reports/[id]/page.tsx`
- Create `src/app/(dashboard)/weekly-reports/[id]/edit/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 5.1 | Finalize coverage calculator formulas | DONE | 3 |
| 5.2 | Expand weekly report Zod schema | DONE | 4 |
| 5.3 | Query reports by current user | DONE | 3 |
| 5.4 | Query reports for lead/admin | DONE | 4 |
| 5.5 | Query single report detail | DONE | 3 |
| 5.6 | Create draft action | DONE | 5 |
| 5.7 | Update draft action | DONE | 5 |
| 5.8 | Compute coverage server-side on save | DONE | 4 |
| 5.9 | Enforce unique project/user/week | DONE | 3 |
| 5.10 | Block editing approved report | DONE | 3 |
| 5.11 | Block creating reports for removed assignment | DONE | 4 |
| 5.12 | Build multi-section weekly report form | DONE | 7 |
| 5.13 | Build report list table | DONE | 4 |
| 5.14 | Build report detail page | DONE | 5 |
| 5.15 | Add inline validation messages | DONE | 4 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 5.T1 | Unit test coverage calculator with normal values | DONE | 3 |
| 5.T2 | Unit test coverage calculator when total test case is 0 | DONE | 3 |
| 5.T3 | Unit test weekly report schema invalid dates | DONE | 3 |
| 5.T4 | Unit test executed cannot exceed total | DONE | 3 |
| 5.T5 | Unit test automation cannot exceed total test cases | DONE | 3 |
| 5.T6 | Unit test approved report cannot edit | DONE | 3 |
| 5.T7 | E2E create draft weekly report happy path | DONE | 8 |
| 5.T8 | E2E edit draft weekly report happy path | DONE | 7 |

### Acceptance Criteria

- Assigned QA can create reports.
- Drafts can be saved repeatedly.
- Coverage is calculated server-side.
- Invalid totals/dates are rejected.
- Approved reports cannot be edited.

---

## Phase 6 — Submit Flow

**Status:** DONE  
**Complexity:** 4

### Files

- Modify `src/lib/weekly-reports/actions.ts`
- Create `src/components/reports/submit-report-button.tsx`
- Modify `src/app/(dashboard)/weekly-reports/[id]/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 6.1 | Create `submitReportAction` | DONE | 4 |
| 6.2 | Validate required submit fields | DONE | 3 |
| 6.3 | Set status `SUBMITTED` | DONE | 2 |
| 6.4 | Set `submitted_at` | DONE | 2 |
| 6.5 | Add submit button with confirmation | DONE | 3 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 6.T1 | Unit test draft → submitted transition | DONE | 2 |
| 6.T2 | Unit test submit rejects missing summary | DONE | 3 |
| 6.T3 | Unit test submit rejects missing next week plan | DONE | 3 |
| 6.T4 | E2E submit report happy path | DONE | 6 |

### Acceptance Criteria

- Valid draft can be submitted.
- Invalid draft cannot be submitted.
- Submitted report waits for review.

---

## Phase 7 — Review Flow

**Status:** DONE  
**Complexity:** 6

### Files

- Create `src/lib/reviews/actions.ts`
- Create `src/lib/reviews/queries.ts`
- Create `src/components/reports/feedback-form.tsx`
- Create `src/components/reports/feedback-history.tsx`
- Create `src/components/reports/review-actions.tsx`
- Create `src/app/(dashboard)/weekly-reports/[id]/review/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 7.1 | Create `markReviewedAction` | DONE | 3 |
| 7.2 | Create `requestRevisionAction` | DONE | 4 |
| 7.3 | Create `approveReportAction` | DONE | 4 |
| 7.4 | Insert feedback history records | DONE | 3 |
| 7.5 | Enforce review status transitions | DONE | 5 |
| 7.6 | Require feedback for revision requests | DONE | 3 |
| 7.7 | Build review section on report detail | DONE | 5 |
| 7.8 | Build feedback history component | DONE | 4 |
| 7.9 | Build review actions component | DONE | 4 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 7.T1 | Unit test submitted → reviewed transition | DONE | 3 |
| 7.T2 | Unit test reviewed → need revision transition | DONE | 4 |
| 7.T3 | Unit test reviewed → approved transition | DONE | 4 |
| 7.T4 | Unit test request revision without feedback rejected | DONE | 3 |
| 7.T5 | E2E review and approve report happy path | DONE | 7 |
| 7.T6 | E2E request revision happy path | DONE | 7 |

### Acceptance Criteria

- QA Lead can review reports.
- QA Lead can request revisions with feedback.
- QA Lead can approve reports.
- QA Member cannot review reports.

---

## Phase 8 — Dashboard Summary

**Status:** DONE  
**Complexity:** 6

### Files

- Create `src/lib/dashboard/queries.ts`
- Create `src/components/dashboard/member-dashboard.tsx`
- Create `src/components/dashboard/lead-dashboard.tsx`
- Modify `src/app/(dashboard)/dashboard/page.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 8.1 | Query member dashboard summary | DONE | 4 |
| 8.2 | Query lead dashboard summary | DONE | 6 |
| 8.3 | Count reports by status | DONE | 4 |
| 8.4 | Aggregate production incidents | DONE | 3 |
| 8.5 | Aggregate blockers | DONE | 4 |
| 8.6 | Aggregate coverage by project | DONE | 5 |
| 8.7 | Build member dashboard | DONE | 4 |
| 8.8 | Build lead dashboard | DONE | 5 |
| 8.9 | Build pending review table | DONE | 4 |
| 8.10 | Build need revision table | DONE | 3 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 8.T1 | Unit test status count aggregation | DONE | 4 |
| 8.T2 | Unit test average coverage aggregation | DONE | 4 |
| 8.T3 | Unit test dashboard scoping for member vs lead | DONE | 5 |
| 8.T4 | E2E member dashboard happy path | DONE | 6 |
| 8.T5 | E2E lead dashboard happy path | DONE | 6 |
| 9.T1 | Unit test approved-only filter | DONE | 4 |
| 9.T2 | Unit test monthly metric aggregation | DONE | 5 |
| 9.T3 | E2E monthly summary happy path | DONE | 6 |

### Acceptance Criteria

- Only approved reports are included.
- Filters work by month/project/member.
- Summary values are accurate.

---

## Phase 10 — Markdown Export

**Status:** DONE  
**Complexity:** 4

### Files

- Create `src/lib/monthly-reports/export-markdown.ts`
- Create `src/app/api/monthly-reports/export/route.ts`
- Create `src/components/monthly-reports/export-button.tsx`

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 10.1 | Create Markdown formatter | DONE | 4 |
| 10.2 | Create export route handler | DONE | 4 |
| 10.3 | Add filename format `<project>-<month>.md` | DONE | 2 |
| 10.4 | Add export button | DONE | 2 |
| 10.5 | Ensure export respects filters | DONE | 3 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 10.T1 | Unit test markdown formatter snapshot | DONE | 4 |
| 10.T2 | Unit test export filename | DONE | 2 |
| 10.T3 | E2E markdown export download | TO DO | 6 |

### Acceptance Criteria

- Export downloads `.md` file.
- Markdown follows PRD format.
- Metrics match monthly summary.

---

## Phase 11 — Hardening

**Status:** DONE  
**Complexity:** 5

### Files

- Create `src/lib/action-result.ts`
- Create `src/lib/errors.ts`
- Modify all `src/lib/**/actions.ts`
- Modify all guarded route pages

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 11.1 | Create consistent `ActionResult` type | DONE | 3 |
| 11.2 | Create DB error mapper | DONE | 4 |
| 11.3 | Create permission helper wrappers | DONE | 4 |
| 11.4 | Audit all server actions for permission checks | DONE | 4 |
| 11.5 | Audit all pages for auth guard | DONE | 3 |
| 11.6 | Replace generic catches with mapped errors | DONE | 4 |
| 11.7 | Add no-stack user-facing errors | DONE | 2 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 11.T1 | Unit test permission matrix | DONE | 4 |
| 11.T2 | Unit test DB error mapping | DONE | 3 |
| 11.T3 | Unit test `ActionResult` helpers | DONE | 2 |
| 11.T4 | E2E unauthorized user blocked from admin pages | TO DO | 6 |

### Acceptance Criteria

- No mutation can bypass permission.
- User-facing errors are readable.
- No raw stack trace is shown in normal app flows.

---

## Phase 12 — Test Baseline

**Status:** DONE  
**Complexity:** 5

### Tasks

| ID | Task | Status | Complexity |
|---|---|---|---:|
| 12.1 | Add Vitest script | DONE | 2 |
| 12.2 | Add auth flow tests | DONE | 2 |
| 12.3 | Add profile helper tests | DONE | 2 |
| 12.4 | Add report status formatter tests | DONE | 2 |
| 12.5 | Add report calculator tests | DONE | 3 |
| 12.6 | Add permission matrix tests | DONE | 3 |
| 12.7 | Add Zod schema tests | DONE | 4 |
| 12.8 | Install Playwright | DONE | 4 |
| 12.9 | Add Playwright auth fixture | DONE | 5 |
| 12.10 | Add per-phase E2E specs | TO DO | 7 |

### Testing Tasks

| ID | Test | Status | Complexity |
|---|---|---|---:|
| 12.T1 | Run all Vitest tests | DONE | 1 |
| 12.T2 | Run Playwright smoke test | DONE | 5 |
| 12.T3 | Add CI-ready command list to README | DONE | 2 |

### Acceptance Criteria

- Business logic has unit coverage.
- Each phase has at least one E2E happy path.
- `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

---

## Out of Scope (Future / DROP)

| Item | Status | Notes |
|---|---|---|
| Slack notification | DROP | Future integration |
| Jenkins integration | DROP | Future integration |
| Jira integration | DROP | Future integration |
| GitLab integration | DROP | Future integration |
| AI summary | DROP | Future enhancement |
| Realtime notification | DROP | Future enhancement |
| Native mobile app | DROP | Future product |
| Excel export | DROP | Future reporting |
| Google Workspace SSO | DROP | Future auth |

---

## Required Verification After Every Phase

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

Run when DB schema or seed changes:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Run when E2E is available:

```bash
npm run e2e
```

---

## Next Recommended Action

Start Phase 2: Project CRUD.

Recommended order:

1. Write tests for `projectSchema` and project permission helper.
2. Implement project queries/actions.
3. Build dedicated project routes.
4. Add E2E create/edit/archive project.
5. Verify all commands.
