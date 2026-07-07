# Role-Aware Navigation And Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide inaccessible menu items and restrict project visibility to assigned projects for non-admin/non-lead users.

**Architecture:** Keep access rules in small pure helpers, use them in server pages and client navigation. Project list filtering happens in the database query; breadcrumb labels are derived from the current pathname in the client topbar.

**Tech Stack:** Next.js App Router, React Server Components, Client Components, Drizzle ORM, Vitest.

**Post-implementation update 2026-07-07:** App shell navigation now has device-aware behavior. The topbar trigger collapses the persistent sidebar on desktop (`>=1024px`) and opens a controlled Radix `Sheet` drawer on mobile/tablet (`<1024px`). Both surfaces reuse the same role-aware navigation content, and the mobile drawer closes after route selection. Regression coverage lives in `e2e/mobile-sidebar.spec.ts` at a `390x844` viewport.

---

### Task 1: Role-Aware Helpers

**Files:**
- Create: `src/lib/navigation/items.ts`
- Create: `src/lib/navigation/breadcrumbs.ts`
- Modify: `src/lib/permissions/roles.ts`
- Test: `src/lib/navigation/items.test.ts`
- Test: `src/lib/navigation/breadcrumbs.test.ts`
- Test: `src/lib/permissions/roles.test.ts`

- [ ] Add failing tests for visible nav items, breadcrumb labels, and project visibility role rules.
- [ ] Run targeted tests and confirm RED.
- [ ] Implement pure helpers with minimal route maps.
- [ ] Run targeted tests and confirm GREEN.

### Task 2: Projects Query And Page

**Files:**
- Modify: `src/lib/projects/queries.ts`
- Modify: `src/app/(dashboard)/projects/page.tsx`
- Modify: `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] Add role-aware `listProjectsForUser(user)` query.
- [ ] Use `innerJoin(projectMembers)` + `removedAt IS NULL` for QA_MEMBER.
- [ ] Keep ADMIN/QA_LEAD on full project list.
- [ ] Guard project detail for QA_MEMBER by assignment.

### Task 3: Menu And Breadcrumb UI

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/topbar.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] Sidebar uses `getVisiblePlatformItems(user.role)`.
- [ ] Topbar uses `usePathname()` and `getBreadcrumbItems(pathname)`.
- [ ] Active nav matches nested routes via `pathname === href || pathname.startsWith(href + "/")`.

### Task 4: Hidden Route Guards

**Files:**
- Modify: `src/app/(dashboard)/monthly-reports/page.tsx`

- [ ] Redirect users without `report:export` from monthly reports to dashboard.
- [ ] Leave users page guarded by `requireAdmin()`.
- [ ] Leave weekly reports accessible to QA_LEAD/QA_MEMBER; hide from ADMIN menu.

### Task 5: Verification

**Files:**
- No source changes.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
