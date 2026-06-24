# Collaborative Weekly Report Implementation Plan

**Goal:** Enable multiple QA co-authors per weekly report with internal approval workflow before submission to reviewer.

**Prerequisites:** Node.js 20+, PostgreSQL with Drizzle, Playwright, existing `weekly-reports` module.

**References:** Spec: `docs/superpowers/specs/2026-06-04-collaborative-weekly-report-design.md`

**Post-implementation update 2026-06-24:** Weekly report creation now uses an initial draft flow. `New report` and dashboard checklist `Create` call `createInitialWeeklyReportDraftAction`, which immediately inserts a `DRAFT` row for the selected project/week, snapshots co-authors, logs `CREATED`, and redirects to edit. The older `createDraftAction` still exists for the long-form create route/backward compatibility, but primary UI entry points no longer wait for the first Save Draft to create the row. Duplicate prevention is based on the existing `weekly_reports` row and the unique `(project_id, week_start_date, week_end_date)` constraint.

---

## Phase 1: Database & Schema

### Task 1: Schema & Migration

**Goal:** Update `src/db/schema.ts` to add new tables and modify `weekly_reports`. Generate migration file using `drizzle-kit generate`, then edit it to add backfill DML. Apply migration.

**Files:**
- `src/db/schema.ts`
- `drizzle/` (auto-generated migration file)

**Steps:**

- [ ] **Step 1.1: Update `src/db/schema.ts`**

Add `PENDING_QA_APPROVAL` to `reportStatusEnum`:

```typescript
export const reportStatusEnum = pgEnum('report_status', [
  'DRAFT',
  'PENDING_QA_APPROVAL',  // NEW
  'SUBMITTED',
  'REVIEWED',
  'NEED_REVISION',
  'APPROVED',
]);
```

Add new tables after `weekly_reports` definition:

```typescript
export const reportAuthors = pgTable('report_authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  weeklyReportId: uuid('weekly_report_id').references(() => weeklyReports.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  projectMemberId: uuid('project_member_id').references(() => projectMembers.id),
  assignmentRole: roleEnum('assignment_role'),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
}, (table) => ({
  uniquePerReport: uniqueIndex().on(table.weeklyReportId, table.userId),
}));

export const reportQaApprovals = pgTable('report_qa_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  weeklyReportId: uuid('weekly_report_id').references(() => weeklyReports.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniquePerReport: uniqueIndex().on(table.weeklyReportId, table.userId),
}));

export const reportActivities = pgTable('report_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  weeklyReportId: uuid('weekly_report_id').references(() => weeklyReports.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  changedFields: jsonb('changed_fields'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Modify `weeklyReports` table definition:

```typescript
// Remove: userId: uuid('user_id').references(() => users.id).notNull(),
// Add:
createdBy: uuid('created_by').references(() => users.id).notNull(),
submittedBy: uuid('submitted_by').references(() => users.id),

// Change unique index:
// FROM: uniqueIndex().on(table.projectId, table.userId, table.weekStartDate, table.weekEndDate)
// TO:
uniqueIndex().on(table.projectId, table.weekStartDate, table.weekEndDate)
```

Add relations for new tables:

```typescript
export const reportAuthorsRelations = relations(reportAuthors, ({ one }) => ({
  weeklyReport: one(weeklyReports, { fields: [reportAuthors.weeklyReportId], references: [weeklyReports.id] }),
  user: one(users, { fields: [reportAuthors.userId], references: [users.id] }),
  projectMember: one(projectMembers, { fields: [reportAuthors.projectMemberId], references: [projectMembers.id] }),
}));

export const reportQaApprovalsRelations = relations(reportQaApprovals, ({ one }) => ({
  weeklyReport: one(weeklyReports, { fields: [reportQaApprovals.weeklyReportId], references: [weeklyReports.id] }),
  user: one(users, { fields: [reportQaApprovals.userId], references: [users.id] }),
}));

export const reportActivitiesRelations = relations(reportActivities, ({ one }) => ({
  weeklyReport: one(weeklyReports, { fields: [reportActivities.weeklyReportId], references: [weeklyReports.id] }),
  actor: one(users, { fields: [reportActivities.actorId], references: [users.id] }),
}));

// Update weeklyReportsRelations:
export const weeklyReportsRelations = relations(weeklyReports, ({ one, many }) => ({
  project: one(projects, { fields: [weeklyReports.projectId], references: [projects.id] }),
  creator: one(users, { relationName: 'weeklyReportsCreator', fields: [weeklyReports.createdBy], references: [users.id] }),
  submitter: one(users, { relationName: 'weeklyReportsSubmitter', fields: [weeklyReports.submittedBy], references: [users.id] }),
  authors: many(reportAuthors),
  approvals: many(reportQaApprovals),
  activities: many(reportActivities),
}));

// Update usersRelations to include new relations:
export const usersRelations = relations(users, ({ many, one }) => ({
  // ... existing
  createdWeeklyReports: many(weeklyReports, { relationName: 'weeklyReportsCreator' }),
  submittedWeeklyReports: many(weeklyReports, { relationName: 'weeklyReportsSubmitter' }),
  reportAuthorships: many(reportAuthors),
  reportApprovals: many(reportQaApprovals),
  reportActivities: many(reportActivities),
}));
```

- [ ] **Step 1.2: Generate migration file**

Run:
```bash
npm run db:generate
```

Expected: Drizzle creates `drizzle/0004_<name>.sql` with DDL for schema changes.

- [ ] **Step 1.3: Edit migration file to add backfill DML**

Open `drizzle/0004_<name>.sql`. The generated file will have DDL (CREATE TABLE, ALTER TABLE, etc.). Add the following DML at the end (but after all DDL statements):

```sql
-- Backfill created_by and submitted_by for existing reports
UPDATE weekly_reports
SET created_by = user_id,
    submitted_by = CASE
      WHEN status IN ('SUBMITTED', 'REVIEWED', 'NEED_REVISION', 'APPROVED')
      THEN user_id
      ELSE NULL
    END;

-- Backfill report_authors (each existing report gets its creator as sole author)
INSERT INTO report_authors (id, weekly_report_id, user_id, added_at)
SELECT gen_random_uuid(), id, created_by, NOW()
FROM weekly_reports;

-- Backfill report_qa_approvals (auto-approve for already-submitted/approved reports)
INSERT INTO report_qa_approvals (id, weekly_report_id, user_id, approved_at)
SELECT gen_random_uuid(), id, created_by, NOW()
FROM weekly_reports
WHERE status IN ('SUBMITTED', 'REVIEWED', 'NEED_REVISION', 'APPROVED');
```

**⚠️ Important:** If `ALTER TYPE report_status ADD VALUE 'PENDING_QA_APPROVAL'` appears in a `BEGIN ... COMMIT;` transaction block in the generated SQL, you must manually move that `ALTER TYPE` statement outside the transaction block. PostgreSQL does not allow `ADD VALUE` inside a transaction.

- [ ] **Step 1.4: Verify migration SQL is valid**

Read the edited `drizzle/0004_<name>.sql`. Manually verify:
1. No duplicate `CREATE TABLE` statements.
2. Unique index `idx_weekly_reports_project_user_week` is dropped.
3. New unique index `idx_weekly_reports_project_week` is created.
4. `ALTER TYPE` is outside any transaction block.
5. DML (UPDATE/INSERT) statements are after all DDL (CREATE/ALTER/DROP).
6. No syntax errors (you can optionally test with `psql` dry-run if desired).

- [ ] **Step 1.5: Apply migration**

Run:
```bash
npm run db:migrate
```

Expected: Migration applies successfully. No errors.

- [ ] **Step 1.6: Verify backfill**

Run in `psql` or `db:studio`:
```sql
SELECT 
  id, 
  status,
  created_by,
  submitted_by,
  (SELECT COUNT(*) FROM report_authors ra WHERE ra.weekly_report_id = weekly_reports.id) AS author_count,
  (SELECT COUNT(*) FROM report_qa_approvals ra WHERE ra.weekly_report_id = weekly_reports.id) AS approval_count
FROM weekly_reports
LIMIT 10;
```

Expected:
- All rows have `created_by IS NOT NULL`.
- Rows with `status IN ('SUBMITTED','REVIEWED','NEED_REVISION','APPROVED')` have `submitted_by IS NOT NULL`.
- All rows have `author_count = 1`.
- Approved/submitted rows have `approval_count = 1`.
- Draft rows have `approval_count = 0`.

**⚠️ Risk:** If multiple existing reports share the same `(project_id, week_start_date, week_end_date)` but have different `user_id`, the unique index creation will fail. Pre-check:
```sql
SELECT project_id, week_start_date, week_end_date, COUNT(*)
FROM weekly_reports
GROUP BY project_id, week_start_date, week_end_date
HAVING COUNT(*) > 1;
```
If duplicates exist, manually deduplicate (merge or delete) before running `db:migrate`.

---

## Phase 2: Core Library

### Task 2: State Machine & Rules

**Goal:** Implement state machine helpers for the new approval workflow (`DRAFT → PENDING_QA_APPROVAL → SUBMITTED → REVIEWED/APPROVED`), and content field detection logic.

**Files:**
- `src/lib/weekly-reports/transitions.ts` (extend)
- `src/lib/weekly-reports/rules.ts` (extend)

**Steps:**

- [ ] **Step 2.1: Add workflow transition helpers to `transitions.ts`**

Append after existing helpers:

```typescript
export function canStartQaApproval(status: ReportStatus): boolean {
  return status === 'DRAFT';
}

export function canApproveAsCoAuthor(
  status: ReportStatus, 
  isCoAuthor: boolean, 
  hasApproved: boolean
): boolean {
  return status === 'PENDING_QA_APPROVAL' && isCoAuthor && !hasApproved;
}

export function canRevokeApproval(
  status: ReportStatus, 
  isCoAuthor: boolean, 
  hasApproved: boolean
): boolean {
  return status === 'PENDING_QA_APPROVAL' && isCoAuthor && hasApproved;
}

export function canRequestQaApproval(status: ReportStatus): boolean {
  return status === 'DRAFT';
}

export function isTerminalStatus(status: ReportStatus): boolean {
  return status === 'APPROVED';
}

export function canEditDraft(status: ReportStatus): boolean {
  return status === 'DRAFT' || status === 'NEED_REVISION' || status === 'PENDING_QA_APPROVAL';
}
```

- [ ] **Step 2.2: Add content field detection to `rules.ts`**

Append after existing helpers:

```typescript
export const CONTENT_FIELDS = [
  'summary',
  'nextWeekPlan',
  'blocker',
  'notes',
  'productionIncidentCount',
  'productionIncidentNotes',
  'bugDocumentUrl',
  'testCaseBeTotal',
  'testCaseBeExecuted',
  'testCaseFeTotal',
  'testCaseFeExecuted',
  'testCaseTotal',
  'automationBeTotal',
  'automationFeTotal',
  'automationBePassed',
  'automationBeFailed',
  'automationFePassed',
  'automationFeFailed',
  'automationPassed',
  'automationFailed',
  'automationBeCoverage',
  'automationFeCoverage',
  'automationCoverage',
  'automationBePassRate',
  'automationFePassRate',
  'executionCoverage',
] as const;

export type ContentField = (typeof CONTENT_FIELDS)[number];

export function isContentField(fieldName: string): fieldName is ContentField {
  return CONTENT_FIELDS.includes(fieldName as ContentField);
}

export function detectContentChanges(
  prev: Partial<Record<string, unknown>>,
  next: Partial<Record<string, unknown>>
): string[] {
  const changedFields: string[] = [];
  
  for (const field of CONTENT_FIELDS) {
    const prevVal = prev[field];
    const nextVal = next[field];
    
    if (prevVal !== nextVal) {
      if (prevVal === undefined || nextVal === undefined) {
        changedFields.push(field);
      } else if (typeof prevVal === 'number' && typeof nextVal === 'number') {
        if (prevVal.toFixed(2) !== nextVal.toFixed(2)) {
          changedFields.push(field);
        }
      } else {
        changedFields.push(field);
      }
    }
  }
  
  return changedFields;
}
```

- [ ] **Step 2.3: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 2.4: Commit**

```bash
git add src/lib/weekly-reports/transitions.ts src/lib/weekly-reports/rules.ts
git commit -m "feat: add state machine helpers and content field detection"
```

---

### Task 3: Activity Logging Helper

**Goal:** Create `activity.ts` with helper to log events to `report_activities` table, and define action constants.

**Files:**
- `src/lib/weekly-reports/activity.ts` (create)

**Steps:**

- [ ] **Step 3.1: Create activity logging helper**

Create `src/lib/weekly-reports/activity.ts`:

```typescript
import { db } from '@/db/client';
import { reportActivities } from '@/db/schema';

export const ACTIVITY_ACTIONS = {
  CREATED: 'CREATED',
  EDITED: 'EDITED',
  QA_APPROVAL_REQUESTED: 'QA_APPROVAL_REQUESTED',
  QA_APPROVED: 'QA_APPROVED',
  QA_APPROVAL_REVOKED: 'QA_APPROVAL_REVOKED',
  SUBMITTED_TO_REVIEWER: 'SUBMITTED_TO_REVIEWER',
  REVIEWED: 'REVIEWED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export interface InsertActivityInput {
  weeklyReportId: string;
  actorId: string;
  action: ActivityAction;
  changedFields?: string[];
}

export async function insertActivity(input: InsertActivityInput): Promise<void> {
  await db.insert(reportActivities).values({
    weeklyReportId: input.weeklyReportId,
    actorId: input.actorId,
    action: input.action,
    changedFields: input.changedFields ? JSON.stringify(input.changedFields) : null,
  });
}
```

- [ ] **Step 3.2: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/lib/weekly-reports/activity.ts
git commit -m "feat: add activity logging helper"
```

---

## Phase 3: Repository & Actions

### Task 4: Repository Queries Refactor

**Goal:** Refactor existing queries to support co-authors (replace `userId` with `createdBy`/`submittedBy`), add new queries for co-authors, approvals, and activities.

**Files:**
- `src/lib/weekly-reports/queries.ts` (refactor)
- `src/lib/weekly-reports/co-author-queries.ts` (create)

**Steps:**

- [ ] **Step 4.1: Refactor `queries.ts` to remove `userId` references**

Update `listReportsByUser` to query by co-author:

```typescript
export async function listReportsByUser(userId: string) {
  const results = await db
    .select({
      report: weeklyReports,
      project: projects,
      creator: users,
      submittedByUser: users,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .innerJoin(users, eq(weeklyReports.createdBy, users.id))
    .leftJoin(users, eq(weeklyReports.submittedBy, users.id))
    .innerJoin(reportAuthors, eq(weeklyReports.id, reportAuthors.weeklyReportId))
    .where(eq(reportAuthors.userId, userId))
    .orderBy(desc(weeklyReports.createdAt));

  return results.map(({ report, project, creator, submittedByUser }) => ({
    ...report,
    projectName: project.name,
    creatorName: creator.name,
    submittedByName: submittedByUser?.name ?? null,
  }));
}
```

Update `getReportById` to fetch related data:

```typescript
export async function getReportById(id: string) {
  const result = await db
    .select({
      report: weeklyReports,
      project: projects,
      creator: users,
      submittedByUser: users,
    })
    .from(weeklyReports)
    .innerJoin(projects, eq(weeklyReports.projectId, projects.id))
    .innerJoin(users, eq(weeklyReports.createdBy, users.id))
    .leftJoin(users, eq(weeklyReports.submittedBy, users.id))
    .where(eq(weeklyReports.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const { report, project, creator, submittedByUser } = result[0];
  return {
    ...report,
    projectName: project.name,
    creatorName: creator.name,
    submittedByName: submittedByUser?.name ?? null,
  };
}
```

Update `createDraft` to use `createdBy` instead of `userId`:

```typescript
export async function createDraft(input: CreateDraftInput) {
  const [result] = await db
    .insert(weeklyReports)
    .values({
      projectId: input.projectId,
      createdBy: input.userId,  // Changed from userId
      weekStartDate: input.weekStartDate,
      weekEndDate: input.weekEndDate,
      summary: input.summary,
      nextWeekPlan: input.nextWeekPlan,
      status: 'DRAFT',
    })
    .returning();

  return result;
}
```

Update `updateDraft` to check co-author access:

```typescript
export async function updateDraft(id: string, updates: UpdateDraftInput, userId: string) {
  const isCoAuthor = await isUserCoAuthor(id, userId);
  if (!isCoAuthor) {
    throw new Error('User is not a co-author of this report');
  }

  const [result] = await db
    .update(weeklyReports)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(weeklyReports.id, id))
    .returning();

  return result;
}
```

Update `submitReport` to use `submittedBy`:

```typescript
export async function submitReport(id: string, userId: string) {
  const [result] = await db
    .update(weeklyReports)
    .set({
      status: 'SUBMITTED',
      submittedBy: userId,  // Changed from userId
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(weeklyReports.id, id))
    .returning();

  return result;
}
```

- [ ] **Step 4.2: Create co-author queries module**

Create `src/lib/weekly-reports/co-author-queries.ts`:

```typescript
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { reportAuthors, reportQaApprovals, reportActivities, users } from '@/db/schema';

export async function listCoAuthors(weeklyReportId: string) {
  return db
    .select({
      author: reportAuthors,
      user: users,
      approval: reportQaApprovals,
    })
    .from(reportAuthors)
    .innerJoin(users, eq(reportAuthors.userId, users.id))
    .leftJoin(
      reportQaApprovals,
      and(
        eq(reportAuthors.weeklyReportId, reportQaApprovals.weeklyReportId),
        eq(reportAuthors.userId, reportQaApprovals.userId)
      )
    )
    .where(eq(reportAuthors.weeklyReportId, weeklyReportId));
}

export async function isUserCoAuthor(weeklyReportId: string, userId: string): Promise<boolean> {
  const [author] = await db
    .select()
    .from(reportAuthors)
    .where(
      and(
        eq(reportAuthors.weeklyReportId, weeklyReportId),
        eq(reportAuthors.userId, userId)
      )
    )
    .limit(1);

  return !!author;
}

export async function hasUserApproved(weeklyReportId: string, userId: string): Promise<boolean> {
  const [approval] = await db
    .select()
    .from(reportQaApprovals)
    .where(
      and(
        eq(reportQaApprovals.weeklyReportId, weeklyReportId),
        eq(reportQaApprovals.userId, userId)
      )
    )
    .limit(1);

  return !!approval;
}

export async function countApprovals(weeklyReportId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reportQaApprovals)
    .where(eq(reportQaApprovals.weeklyReportId, weeklyReportId));

  return result?.count ?? 0;
}

export async function countAuthors(weeklyReportId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reportAuthors)
    .where(eq(reportAuthors.weeklyReportId, weeklyReportId));

  return result?.count ?? 0;
}

export async function listActivities(weeklyReportId: string) {
  return db
    .select({
      activity: reportActivities,
      actor: users,
    })
    .from(reportActivities)
    .innerJoin(users, eq(reportActivities.actorId, users.id))
    .where(eq(reportActivities.weeklyReportId, weeklyReportId))
    .orderBy(desc(reportActivities.createdAt));
}
```

Add missing import to `co-author-queries.ts`:

```typescript
import { sql } from 'drizzle-orm';
```

- [ ] **Step 4.3: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 4.4: Commit**

```bash
git add src/lib/weekly-reports/queries.ts src/lib/weekly-reports/co-author-queries.ts
git commit -m "refactor: update repository queries for co-author support"
```

---

### Task 5: Server Actions Refactor

**Goal:** Refactor existing server actions to support co-authors, approval workflow, and activity logging. Add new actions for QA approval/revoke and snapshot co-authors on report creation.

**Files:**
- `src/lib/weekly-reports/actions.ts` (refactor)
- `src/lib/weekly-reports/co-author-actions.ts` (create)

**Steps:**

- [ ] **Step 5.1: Refactor `actions.ts` to support co-authors and activity logging**

Update imports:

```typescript
import { reportAuthors, reportQaApprovals } from '@/db/schema';
import { insertActivity, ACTIVITY_ACTIONS } from './activity';
import { detectContentChanges } from './rules';
import { isUserCoAuthor, listCoAuthors } from './co-author-queries';
import { eq, and } from 'drizzle-orm';
```

Update `createDraftAction` to snapshot co-authors and log activity:

```typescript
export async function createDraftAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const projectId = formData.get('projectId') as string;
  const weekStartDate = new Date(formData.get('weekStartDate') as string);
  const weekEndDate = new Date(formData.get('weekEndDate') as string);
  const summary = formData.get('summary') as string;
  const nextWeekPlan = formData.get('nextWeekPlan') as string;

  const report = await createDraft({
    projectId,
    userId: user.id,
    weekStartDate,
    weekEndDate,
    summary,
    nextWeekPlan,
  });

  // Snapshot co-authors: all active members of the project
  const activeMembers = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  for (const member of activeMembers) {
    await db.insert(reportAuthors).values({
      weeklyReportId: report.id,
      userId: member.userId,
      projectMemberId: member.id,
      assignmentRole: member.assignmentRole,
    });
  }

  // Log activity
  await insertActivity({
    weeklyReportId: report.id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.CREATED,
  });

  return { reportId: report.id };
}
```

Update `updateDraftAction` to check co-author access, detect content changes, reset approvals, and log activity:

```typescript
export async function updateDraftAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const report = await getReportById(id);
  if (!report) return { error: 'Report not found' };

  if (!canEditDraft(report.status)) {
    return { error: 'Cannot edit report in current status' };
  }

  const isCoAuthor = await isUserCoAuthor(id, user.id);
  if (!isCoAuthor) {
    return { error: 'User is not a co-author of this report' };
  }

  const summary = formData.get('summary') as string;
  const nextWeekPlan = formData.get('nextWeekPlan') as string;
  // ... parse other fields from formData

  const updates = {
    summary,
    nextWeekPlan,
    // ... other fields
  };

  // Detect content changes
  const changedFields = detectContentChanges(report, updates);

  // Reset approvals if content changed
  if (changedFields.length > 0) {
    await db.delete(reportQaApprovals).where(eq(reportQaApprovals.weeklyReportId, id));

    // Revert status to DRAFT if was PENDING_QA_APPROVAL or NEED_REVISION
    if (report.status === 'PENDING_QA_APPROVAL' || report.status === 'NEED_REVISION') {
      await db.update(weeklyReports)
        .set({ status: 'DRAFT' })
        .where(eq(weeklyReports.id, id));
    }
  }

  await updateDraft(id, updates, user.id);

  // Log activity
  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.EDITED,
    changedFields,
  });

  return { success: true };
}
```

Update `submitReportAction` to check co-author access and log activity:

```typescript
export async function submitReportAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const report = await getReportById(id);
  if (!report) return { error: 'Report not found' };

  if (!canSubmitReport(report.status)) {
    return { error: 'Cannot submit report in current status' };
  }

  const isCoAuthor = await isUserCoAuthor(id, user.id);
  if (!isCoAuthor) {
    return { error: 'User is not a co-author of this report' };
  }

  await submitReport(id, user.id);

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.SUBMITTED,
  });

  return { success: true };
}
```

- [ ] **Step 5.2: Create co-author actions module**

Create `src/lib/weekly-reports/co-author-actions.ts`:

```typescript
import 'use server';
import { db } from '@/db/client';
import { weeklyReports, reportQaApprovals } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { getReportById } from './queries';
import { isUserCoAuthor, hasUserApproved, countApprovals, countAuthors } from './co-author-queries';
import { canApproveAsCoAuthor, canRevokeApproval, canRequestQaApproval } from './transitions';
import { insertActivity, ACTIVITY_ACTIONS } from './activity';
import { eq } from 'drizzle-orm';

export async function requestQaApprovalAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const report = await getReportById(id);
  if (!report) return { error: 'Report not found' };

  if (!canRequestQaApproval(report.status)) {
    return { error: 'Cannot request QA approval in current status' };
  }

  const isCoAuthor = await isUserCoAuthor(id, user.id);
  if (!isCoAuthor) {
    return { error: 'User is not a co-author of this report' };
  }

  await db.update(weeklyReports)
    .set({ status: 'PENDING_QA_APPROVAL' })
    .where(eq(weeklyReports.id, id));

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVAL_REQUESTED,
  });

  return { success: true };
}

export async function approveAsCoAuthorAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const report = await getReportById(id);
  if (!report) return { error: 'Report not found' };

  const isCoAuthor = await isUserCoAuthor(id, user.id);
  const hasApproved = await hasUserApproved(id, user.id);

  if (!canApproveAsCoAuthor(report.status, isCoAuthor, hasApproved)) {
    return { error: 'Cannot approve as co-author in current status' };
  }

  await db.insert(reportQaApprovals).values({
    weeklyReportId: id,
    userId: user.id,
    approvedAt: new Date(),
  });

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVED,
  });

  // Check if all co-authors have approved
  const approvalCount = await countApprovals(id);
  const authorCount = await countAuthors(id);

  if (approvalCount === authorCount) {
    // Auto-submit to reviewer
    await db.update(weeklyReports)
      .set({ status: 'SUBMITTED', submittedBy: user.id, submittedAt: new Date() })
      .where(eq(weeklyReports.id, id));

    await insertActivity({
      weeklyReportId: id,
      actorId: user.id,
      action: ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER,
    });

    return { success: true, autoSubmitted: true };
  }

  return { success: true, autoSubmitted: false };
}

export async function revokeApprovalByCoAuthorAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const report = await getReportById(id);
  if (!report) return { error: 'Report not found' };

  const isCoAuthor = await isUserCoAuthor(id, user.id);
  const hasApproved = await hasUserApproved(id, user.id);

  if (!canRevokeApproval(report.status, isCoAuthor, hasApproved)) {
    return { error: 'Cannot revoke approval in current status' };
  }

  await db.delete(reportQaApprovals)
    .where(eq(reportQaApprovals.weeklyReportId, id))
    .where(eq(reportQaApprovals.userId, user.id));

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED,
  });

  return { success: true };
}
```

Add missing imports to `co-author-actions.ts`:

```typescript
import { and } from 'drizzle-orm';
```

- [ ] **Step 5.3: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/lib/weekly-reports/actions.ts src/lib/weekly-reports/co-author-actions.ts
git commit -m "feat: add co-author actions and approval workflow"
```

---

## Phase 4: UI Components

### Task 6: UI Status Utilities

**Goal:** Update status badge dan label functions untuk mendukung status `PENDING_QA_APPROVAL`.

**Files:**
- `src/lib/reports/status.ts` (update)

**Steps:**

- [ ] **Step 6.1: Update status label function**

Open `src/lib/reports/status.ts`, find function `getStatusLabel` atau serupa. Add case:

```typescript
case 'PENDING_QA_APPROVAL':
  return 'Menunggu Approval QA';
```

Add case untuk description:

```typescript
case 'PENDING_QA_APPROVAL':
  return 'Report menunggu approval dari semua co-author';
```

- [ ] **Step 6.2: Update status badge component**

Open `src/components/common/StatusBadge.tsx` atau file badge yang ada. Add color variant:

```typescript
case 'PENDING_QA_APPROVAL':
  className = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
  break;
```

- [ ] **Step 6.3: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 6.4: Commit**

```bash
git add src/lib/reports/status.ts src/components/common/StatusBadge.tsx
git commit -m "feat: add PENDING_QA_APPROVAL status to UI"
```

---

### Task 7: Co-Authors Panel Component

**Goal:** Create server component yang menampilkan daftar co-authors dengan approval status mereka.

**Files:**
- `src/components/reports/CoAuthorsPanel.tsx` (create)

**Steps:**

- [ ] **Step 7.1: Create co-authors panel component**

Create `src/components/reports/CoAuthorsPanel.tsx`:

```tsx
import { listCoAuthors } from '@/lib/weekly-reports/co-author-queries';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface CoAuthorsPanelProps {
  weeklyReportId: string;
  className?: string;
}

export async function CoAuthorsPanel({ weeklyReportId, className }: CoAuthorsPanelProps) {
  const coAuthors = await listCoAuthors(weeklyReportId);

  if (coAuthors.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">Co-Authors</h3>
      <div className="space-y-2">
        {coAuthors.map((item) => (
          <div
            key={item.author.id}
            className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">{item.user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.approval ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <Badge variant="success">Approved</Badge>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-gray-400" />
                  <Badge variant="secondary">Pending</Badge>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 7.3: Commit**

```bash
git add src/components/reports/CoAuthorsPanel.tsx
git commit -m "feat: add co-authors panel component"
```

---

### Task 8: Activity Timeline Component

**Goal:** Create server component yang menampilkan history aktivitas report.

**Files:**
- `src/components/reports/ActivityTimeline.tsx` (create)

**Steps:**

- [ ] **Step 8.1: Create activity timeline component**

Create `src/components/reports/ActivityTimeline.tsx`:

```tsx
import { listActivities } from '@/lib/weekly-reports/co-author-queries';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

interface ActivityTimelineProps {
  weeklyReportId: string;
  className?: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Created report',
  EDITED: 'Edited report',
  QA_APPROVAL_REQUESTED: 'Requested QA approval',
  QA_APPROVED: 'Approved as co-author',
  QA_APPROVAL_REVOKED: 'Revoked approval',
  SUBMITTED_TO_REVIEWER: 'Submitted to reviewer',
  REVIEWED: 'Reviewed by lead',
  NEED_REVISION: 'Requested revision',
  APPROVED: 'Approved by lead',
};

export async function ActivityTimeline({ weeklyReportId, className }: ActivityTimelineProps) {
  const activities = await listActivities(weeklyReportId);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">Activity History</h3>
      <div className="space-y-3">
        {activities.map((activity) => {
          const actionLabel = ACTION_LABELS[activity.action] || activity.action;
          const timestamp = format(new Date(activity.activity.createdAt), 'PPp');
          
          return (
            <div
              key={activity.activity.id}
              className="flex gap-3 p-3 border rounded-lg dark:border-gray-700"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{actionLabel}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.actor.name} • {timestamp}
                    </p>
                    {activity.activity.changedFields && activity.activity.changedFields.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Changed fields:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activity.activity.changedFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Verify syntax**

Run:
```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 8.3: Commit**

```bash
git add src/components/reports/ActivityTimeline.tsx
git commit -m "feat: add activity timeline component"
```

---

### Task 9: Detail Page Integration

**Goal:** Update report detail page untuk menampilkan co-authors panel, activity timeline, dan approval buttons.

**Files:**
- `src/app/reports/[id]/page.tsx` (update)

**Steps:**

- [ ] **Step 9.1: Add co-authors panel and activity timeline to detail page**

Open `src/app/reports/[id]/page.tsx`. After main report details section, add:

```tsx
import { CoAuthorsPanel } from '@/components/reports/CoAuthorsPanel';
import { ActivityTimeline } from '@/components/reports/ActivityTimeline';
import { QaApprovalButton } from '@/components/reports/QaApprovalButton';

// Inside the page component, after main content:

<section className="mt-8 space-y-6">
  <CoAuthorsPanel weeklyReportId={report.id} />
  
  {report.status === 'PENDING_QA_APPROVAL' && (
    <div className="p-4 border rounded-lg dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3">Your Approval</h3>
      <QaApprovalButton weeklyReportId={report.id} currentUserId={user.id} />
    </div>
  )}
  
  <ActivityTimeline weeklyReportId={report.id} />
</section>
```

- [ ] **Step 9.2: Update page title untuk show current status**

Find the page title/header section. Update to show status:

```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold">Weekly Report</h1>
  <StatusBadge status={report.status} />
</div>
```

- [ ] **Step 9.3: Test the page manually**

Run:
```bash
npm run dev
```

Navigate to a report detail page. Verify:
- Co-authors panel shows all authors with approval status
- Activity timeline shows history
- QaApprovalButton appears when status is PENDING_QA_APPROVAL

- [ ] **Step 9.4: Commit**

```bash
git add src/app/reports/[id]/page.tsx
git commit -m "feat: integrate co-authors and activity into detail page"
```

---

## Phase 5: Testing

### Task 10: Unit Tests

**Goal:** Write unit tests untuk state machine helpers, content field detection, dan activity logging.

**Files:**
- `src/lib/weekly-reports/transitions.test.ts` (update)
- `src/lib/weekly-reports/rules.test.ts` (update)
- `src/lib/weekly-reports/activity.test.ts` (create)

**Steps:**

- [ ] **Step 10.1: Add unit tests for transitions**

Append to `src/lib/weekly-reports/transitions.test.ts`:

```typescript
describe('canStartQaApproval', () => {
  it('returns true for DRAFT status', () => {
    expect(canStartQaApproval('DRAFT')).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(canStartQaApproval('PENDING_QA_APPROVAL')).toBe(false);
    expect(canStartQaApproval('SUBMITTED')).toBe(false);
  });
});

describe('canApproveAsCoAuthor', () => {
  it('returns true when status is PENDING_QA_APPROVAL, is co-author, and has not approved', () => {
    expect(canApproveAsCoAuthor('PENDING_QA_APPROVAL', true, false)).toBe(true);
  });

  it('returns false when already approved', () => {
    expect(canApproveAsCoAuthor('PENDING_QA_APPROVAL', true, true)).toBe(false);
  });

  it('returns false when not a co-author', () => {
    expect(canApproveAsCoAuthor('PENDING_QA_APPROVAL', false, false)).toBe(false);
  });
});

describe('canRevokeApproval', () => {
  it('returns true when status is PENDING_QA_APPROVAL, is co-author, and has approved', () => {
    expect(canRevokeApproval('PENDING_QA_APPROVAL', true, true)).toBe(true);
  });

  it('returns false when has not approved', () => {
    expect(canRevokeApproval('PENDING_QA_APPROVAL', true, false)).toBe(false);
  });
});
```

- [ ] **Step 10.2: Add unit tests for content field detection**

Append to `src/lib/weekly-reports/rules.test.ts`:

```typescript
describe('isContentField', () => {
  it('returns true for content fields', () => {
    expect(isContentField('summary')).toBe(true);
    expect(isContentField('nextWeekPlan')).toBe(true);
    expect(isContentField('blocker')).toBe(true);
  });

  it('returns false for non-content fields', () => {
    expect(isContentField('status')).toBe(false);
    expect(isContentField('createdBy')).toBe(false);
  });
});

describe('detectContentChanges', () => {
  it('detects changed content fields', () => {
    const prev = { summary: 'Old summary', status: 'DRAFT' };
    const next = { summary: 'New summary', status: 'DRAFT' };
    const changes = detectContentChanges(prev, next);
    expect(changes).toEqual(['summary']);
  });

  it('ignores non-content fields', () => {
    const prev = { summary: 'Same', status: 'DRAFT' };
    const next = { summary: 'Same', status: 'SUBMITTED' };
    const changes = detectContentChanges(prev, next);
    expect(changes).toEqual([]);
  });

  it('returns multiple changed fields', () => {
    const prev = { summary: 'A', blocker: 'B', notes: 'C' };
    const next = { summary: 'X', blocker: 'Y', notes: 'C' };
    const changes = detectContentChanges(prev, next);
    expect(changes).toContain('summary');
    expect(changes).toContain('blocker');
    expect(changes).not.toContain('notes');
  });
});
```

- [ ] **Step 10.3: Create unit tests for activity logging**

Create `src/lib/weekly-reports/activity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ACTIVITY_ACTIONS, type ActivityAction } from './activity';

describe('activity logging', () => {
  it('exports all required activity actions', () => {
    expect(ACTIVITY_ACTIONS.CREATED).toBe('CREATED');
    expect(ACTIVITY_ACTIONS.EDITED).toBe('EDITED');
    expect(ACTIVITY_ACTIONS.QA_APPROVAL_REQUESTED).toBe('QA_APPROVAL_REQUESTED');
    expect(ACTIVITY_ACTIONS.QA_APPROVED).toBe('QA_APPROVED');
    expect(ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED).toBe('QA_APPROVAL_REVOKED');
    expect(ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER).toBe('SUBMITTED_TO_REVIEWER');
    expect(ACTIVITY_ACTIONS.REVIEWED).toBe('REVIEWED');
    expect(ACTIVITY_ACTIONS.NEED_REVISION).toBe('NEED_REVISION');
    expect(ACTIVITY_ACTIONS.APPROVED).toBe('APPROVED');
  });

  it('type ActivityAction is correctly constrained', () => {
    const validAction: ActivityAction = 'CREATED';
    expect(validAction).toBe('CREATED');
  });
});
```

- [ ] **Step 10.4: Run unit tests**

Run:
```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 10.5: Commit**

```bash
git add src/lib/weekly-reports/transitions.test.ts src/lib/weekly-reports/rules.test.ts src/lib/weekly-reports/activity.test.ts
git commit -m "test: add unit tests for state machine and content detection"
```

---

### Task 11: Integration Tests

**Goal:** Write integration tests untuk server actions dengan approval workflow, co-author snapshot, dan activity logging.

**Files:**
- `src/lib/weekly-reports/actions.test.ts` (update)
- `src/lib/weekly-reports/co-author-actions.test.ts` (create)

**Steps:**

- [ ] **Step 11.1: Add integration tests for createDraftAction**

Append to `src/lib/weekly-reports/actions.test.ts`:

```typescript
import { createDraftAction } from './actions';
import { db } from '@/db/client';
import { weeklyReports, reportAuthors, reportActivities, users, projects, projectMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  requireUser: vi.fn(() => Promise.resolve({ id: 'user-1', name: 'Test User', role: 'QA_MEMBER' })),
}));

describe('createDraftAction with co-authors', () => {
  it('snapshots all active project members as co-authors', async () => {
    // Setup: create project and members
    const [project] = await db.insert(projects).values({
      name: 'Test Project',
      code: 'TEST',
    }).returning();

    const [member1] = await db.insert(projectMembers).values({
      projectId: project.id,
      userId: 'user-1',
      status: 'ACTIVE',
    }).returning();

    const [member2] = await db.insert(projectMembers).values({
      projectId: project.id,
      userId: 'user-2',
      status: 'ACTIVE',
    }).returning();

    // Execute
    const formData = new FormData();
    formData.set('projectId', project.id);
    formData.set('weekStartDate', '2026-06-01');
    formData.set('weekEndDate', '2026-06-07');
    formData.set('summary', 'Test summary');
    formData.set('nextWeekPlan', 'Test plan');

    await createDraftAction(formData);

    // Verify: should have 2 co-authors
    const authors = await db.select()
      .from(reportAuthors)
      .where(eq(reportAuthors.weeklyReportId, /* get report id */));
    
    expect(authors).toHaveLength(2);
    expect(authors.map(a => a.userId)).toContain('user-1');
    expect(authors.map(a => a.userId)).toContain('user-2');
  });

  it('logs CREATED activity when creating draft', async () => {
    // Similar test setup...
    
    await createDraftAction(formData);

    const activities = await db.select()
      .from(reportActivities)
      .where(eq(reportActivities.action, 'CREATED'));
    
    expect(activities).toHaveLength(1);
  });
});
```

Note: This is a skeleton. The actual implementation will need proper setup/teardown and report ID retrieval.

- [ ] **Step 11.2: Create integration tests for co-author actions**

Create `src/lib/weekly-reports/co-author-actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveAsCoAuthorAction, revokeApprovalByCoAuthorAction } from './co-author-actions';
import { db } from '@/db/client';
import { weeklyReports, reportAuthors, reportQaApprovals, reportActivities } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  requireUser: vi.fn(() => Promise.resolve({ id: 'user-1', name: 'Test User', role: 'QA_MEMBER' })),
}));

describe('approveAsCoAuthorAction', () => {
  it('adds approval and logs activity', async () => {
    // Setup: create report with user as co-author
    // Execute: await approveAsCoAuthorAction(reportId)
    // Verify: approval exists, activity logged
  });

  it('auto-submits when last co-author approves', async () => {
    // Setup: 2 co-authors, first already approved
    // Execute: second co-author approves
    // Verify: status = SUBMITTED, submittedBy set
  });
});

describe('revokeApprovalByCoAuthorAction', () => {
  it('removes approval when user has approved', async () => {
    // Setup: user has approval
    // Execute: revoke
    // Verify: approval deleted
  });
});
```

Note: These are skeletons. Complete implementation requires full test database setup.

- [ ] **Step 11.3: Run integration tests**

Run:
```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 11.4: Commit**

```bash
git add src/lib/weekly-reports/actions.test.ts src/lib/weekly-reports/co-author-actions.test.ts
git commit -m "test: add integration tests for approval workflow"
```

---

### Task 12: E2E Tests

**Goal:** Write Playwright E2E tests untuk multi-QA approval workflow.

**Files:**
- `e2e/weekly-reports.spec.ts` (create)

**Steps:**

- [ ] **Step 12.1: Create E2E test for multi-QA workflow**

Create `e2e/weekly-reports.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { setupTestUser, createProject, createProjectMember } from './helpers';

test.describe('Multi-QA Weekly Reports', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestUser(page, 'qa-member-1');
  });

  test('QA member can create report with auto-snapshotted co-authors', async ({ page }) => {
    await createProject({ id: 'project-1', name: 'Test Project' });
    await createProjectMember({ projectId: 'project-1', userId: 'qa-member-1' });
    await createProjectMember({ projectId: 'project-1', userId: 'qa-member-2' });

    await page.goto('/reports/new');
    
    await page.fill('[name="summary"]', 'Test summary');
    await page.fill('[name="nextWeekPlan"]', 'Test plan');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/reports\//);
    await expect(page.locator('text=Co-Authors')).toBeVisible();
    await expect(page.locator('text=qa-member-1')).toBeVisible();
    await expect(page.locator('text=qa-member-2')).toBeVisible();
  });

  test('co-authors can approve in sequence', async ({ page }) => {
    // Member 1 creates and requests approval
    await page.goto('/reports/[report-id]');
    await page.click('button:has-text("Request QA Approval")');
    await expect(page.locator('text=PENDING_QA_APPROVAL')).toBeVisible();

    // Member 1 approves
    await page.click('button:has-text("Approve")');
    await expect(page.locator('text=Approved')).toBeVisible();

    // Login as member 2
    await setupTestUser(page, 'qa-member-2');
    await page.goto('/reports/[report-id]');
    
    // Member 2 approves - should auto-submit
    await page.click('button:has-text("Approve")');
    await expect(page.locator('text=SUBMITTED')).toBeVisible();
  });

  test('approvals reset when report is edited', async ({ page }) => {
    // Setup: report with approvals
    // Edit the report
    // Verify: approvals are reset, status back to DRAFT
  });
});
```

Note: This is a skeleton. Complete implementation requires proper test data setup and selectors.

- [ ] **Step 12.2: Run E2E tests**

Run:
```bash
npm run test:e2e
```

Expected: All tests pass.

- [ ] **Step 12.3: Commit**

```bash
git add e2e/weekly-reports.spec.ts
git commit -m "test: add E2E tests for multi-QA approval workflow"
```

---

## Summary

**Total Tasks:** 12  
**Estimated Time:** 8-12 hours

**Critical Path:**
1. Database migration (Task 1)
2. Core library (Tasks 2-3)
3. Repository & actions (Tasks 4-5)
4. UI components (Tasks 6-9)
5. Testing (Tasks 10-12)

**Key Risks:**
- Migration may fail if duplicate (project, week_start_date) exists
- Approval reset logic complex - test thoroughly
- Activity logging must be atomic with state changes

**Next Steps:**
- Review plan with team
- Start with Task 1 (database migration)
- Test each phase before proceeding
