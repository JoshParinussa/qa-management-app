# Collaborative Weekly Report Design

Date: 2026-06-04
Status: Approved (pending user spec review)

## 1. Problem & Goal

Weekly report saat ini terikat ke satu QA per project per minggu. Dua kebutuhan baru:

1. Detail report harus menampilkan siapa yang men-submit.
2. Project dengan lebih dari satu QA harus bisa mengerjakan satu report bersama-sama. Setiap QA wajib approve internal sebelum atasan (reviewer) dapat melakukan review/approval/revision.

Selain itu user meminta activity log yang jelas: siapa create, siapa edit apa, siapa approve, siapa submit, siapa review.

## 2. Scope

In-scope:

- Refactor model data weekly report jadi shared per project per minggu.
- State machine baru dengan tahap PENDING_QA_APPROVAL.
- Snapshot daftar co-author saat report dibuat.
- Reset approval QA otomatis saat ada edit konten atau revision request.
- Activity log per report (event-level).
- UI co-authors panel, activity timeline, label submitter.

Out-of-scope (di-flag, ditangani belakangan):

- Adjust monthly report aggregator agar pakai snapshot co-author.
- Notifikasi email/realtime.
- Versioned snapshot / diff isi field.
- Manual add/remove co-author setelah snapshot dibuat.

## 3. Data Model

### 3.1 weekly_reports (modifikasi)

- Drop `user_id` dan unique index `(project_id, user_id, week_start_date, week_end_date)`.
- Tambah unique index `(project_id, week_start_date, week_end_date)`.
- Tambah `created_by uuid not null references users(id)`.
- Tambah `submitted_by uuid references users(id)`. Diisi saat report otomatis transit dari PENDING_QA_APPROVAL ke SUBMITTED (yaitu QA terakhir yang approve internal).
- Enum `report_status` ditambah value `PENDING_QA_APPROVAL`.

### 3.2 report_authors (baru)

Snapshot QA wajib-approve. Diisi saat report dibuat.

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | uuid pk | uuidv7 |
| weekly_report_id | uuid not null fk weekly_reports.id on delete cascade | |
| user_id | uuid not null fk users.id | |
| assignment_role | assignment_role not null | snapshot QA_MEMBER / QA_PIC |
| added_at | timestamptz not null default now() | |
| removed_at | timestamptz | nullable, untuk fleksibilitas masa depan |

Unique `(weekly_report_id, user_id)`.

### 3.3 report_qa_approvals (baru)

Approval internal antar QA.

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | uuid pk | uuidv7 |
| weekly_report_id | uuid not null fk weekly_reports.id on delete cascade | |
| user_id | uuid not null fk users.id | |
| approved_at | timestamptz not null default now() | |

Unique `(weekly_report_id, user_id)`. Reset approval = delete row.

### 3.4 report_activities (baru)

Event log untuk audit trail.

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | uuid pk | uuidv7 |
| weekly_report_id | uuid not null fk weekly_reports.id on delete cascade | |
| actor_id | uuid not null fk users.id | |
| action | text not null | enum-like, lihat di bawah |
| changed_fields | jsonb | nullable; array nama field, hanya untuk EDITED |
| note | text | nullable; untuk catatan reviewer |
| created_at | timestamptz not null default now() | |

Action values: `CREATED`, `EDITED`, `QA_APPROVAL_REQUESTED`, `QA_APPROVED`, `QA_APPROVAL_REVOKED`, `SUBMITTED_TO_REVIEWER`, `REVIEWED`, `REVISION_REQUESTED`, `APPROVED`.

### 3.5 report_feedbacks (deprecate)

Tabel lama dipertahankan untuk read-only kompat saat migrasi. Stop write setelah migrasi. Datanya di-backfill ke `report_activities` sebagai event `REVIEWED` / `REVISION_REQUESTED` / `APPROVED` dengan `note` berisi feedback teks lama.

## 4. State Machine

### 4.1 Transitions

```
DRAFT --(QA "Ajukan untuk approval QA")--> PENDING_QA_APPROVAL
PENDING_QA_APPROVAL --(ada edit konten)--> DRAFT (semua approval direset)
PENDING_QA_APPROVAL --(QA approve internal, belum lengkap)--> PENDING_QA_APPROVAL
PENDING_QA_APPROVAL --(QA terakhir approve)--> SUBMITTED (auto, set submitted_by)
SUBMITTED --(reviewer mark reviewed)--> REVIEWED
SUBMITTED --(reviewer minta revision)--> NEED_REVISION (semua approval direset)
NEED_REVISION --(QA edit/save)--> DRAFT (semua approval direset lagi)
SUBMITTED / REVIEWED --(reviewer approve)--> APPROVED (terminal)
```

### 4.2 Auto-submit trigger

Ketika approval count == author count, service action otomatis:
1. Update `weekly_reports.status = 'SUBMITTED'`, `submitted_at = now()`, `submitted_by = approver.id`.
2. Insert activity `SUBMITTED_TO_REVIEWER` (actor = approver terakhir).

### 4.3 Approval reset rule

Edit konten = perubahan field selain metadata (status, submitted_by, timestamps). Daftar field "konten" di-hardcode di helper `isContentField()`:
- summary, nextWeekPlan, blocker, notes
- productionIncidentCount, productionIncidentNotes, bugDocumentUrl
- testCaseBeTotal, testCaseBeExecuted, testCaseFeTotal, testCaseFeExecuted
- automationBe*, automationFe*, testCaseTotal

Saat ada edit konten (di status DRAFT, PENDING_QA_APPROVAL, atau NEED_REVISION):
1. `DELETE FROM report_qa_approvals WHERE weekly_report_id = ?`
2. Jika status `PENDING_QA_APPROVAL` → balikan ke `DRAFT`.
3. Jika status `NEED_REVISION` → balikan ke `DRAFT` saat save pertama.
4. Catat activity `EDITED` + `QA_APPROVAL_REVOKED` (jika ada approval yang dihapus).

Reviewer `requestRevisionAction` juga melakukan reset semua approval.

### 4.4 Snapshot author rule

Snapshot co-author diambil saat `createDraftAction`: semua QA aktif (assignment dengan `removedAt IS NULL`) di project target.

- Minimal berisi creator sendiri.
- `created_by` selalu masuk ke `report_authors`.
- Tolak create jika project tidak punya QA aktif sama sekali.
- Snapshot sekali, tidak berubah meski assignment berubah setelahnya (kecuali manual edit di masa depan — out of scope).

## 5. Permissions

### 5.1 Permission actions (update)

Tambah permission action baru:
- `report:co-author` (implicit, bukan di `roles.ts`) — siapa pun yang ada di `report_authors` boleh edit & approve internal, terlepas dari status assignment sekarang.

Existing:
- `report:create` (QA_MEMBER & QA_LEAD) — bikin draft, edit draft project yang dia ter-assign aktif.
- `report:review` (QA_LEAD) — review/revision/approve di status SUBMITTED atau REVIEWED.

### 5.2 Co-author eligibility helper

```typescript
export async function isCoAuthor(weeklyReportId: string, userId: string): Promise<boolean> {
  const [author] = await db
    .select()
    .from(reportAuthors)
    .where(and(
      eq(reportAuthors.weeklyReportId, weeklyReportId),
      eq(reportAuthors.userId, userId),
    ))
    .limit(1);
  return Boolean(author);
}
```

Digunakan di detail page dan action guards.

### 5.3 Access rule untuk detail page

Saat ini detail page redirect/notFound jika bukan owner atau reviewer. Perluas: boleh akses jika co-author atau reviewer.

```typescript
const hasAccess = isCoAuthor || isReviewer;
if (!hasAccess) {
  notFound();
}
```

### 5.4 Edit rule

Saat ini `updateDraftAction` cek `report.userId === user.id`. Ganti jadi:
- User adalah co-author (ada di `report_authors`).
- Status report adalah DRAFT atau NEED_REVISION (PENDING_QA_APPROVAL juga boleh edit, tapi status akan turun ke DRAFT saat save).

### 5.5 Admin role

ADMIN tetap tidak ikut campur di flow weekly report (sesuai permission existing). Bisa lihat semua report via `listAllReports` tapi tidak bisa create/edit/review.

## 6. UI / UX

### 6.1 List page (/weekly-reports)

- Filter visibility: tampilkan report yang user adalah co-author ATAU reviewer.
- Kolom baru: "Co-authors" — avatar/nama QA penulis (max 3, sisanya `+N`).
- Kolom "Submitted by" — hanya tampil kalau status >= SUBMITTED, isinya `submitted_by` name.
- Status badge: tambah varian `PENDING_QA_APPROVAL` ("Menunggu approval QA") dengan progress mini `2/3`.
- Filter: project, status (extend enum filter), week range.

### 6.2 Detail page (/weekly-reports/[id])

Section dari atas:

1. **Header** — project, week range, status badge, submitter name (kalau ada).
   - Tombol `Edit` (jika eligible).
   - Tombol `Ajukan untuk approval QA` (saat DRAFT, co-author yang belum approve).
   - Tombol `Approve` / `Revoke approval` (di panel co-author, saat PENDING_QA_APPROVAL).

2. **Co-authors panel** (baru, komponen `CoAuthorsPanel`).
   - Kartu daftar semua `report_authors`.
   - Tiap baris: avatar + nama + assignment role (PIC/Member).
   - Badge approval: `Approved` (hijau), `Pending` (abu), `Edited since approval` (kuning, jika approval direvoke karena edit).
   - Counter di header card: "QA approval 2/3".
   - Jika current user adalah co-author dan status `PENDING_QA_APPROVAL`: tombol `Approve` / `Revoke approval` di baris dirinya. Konfirmasi via dialog.

3. **Reviewer panel** (existing, card `ReviewActions`).
   - Hanya muncul saat status `SUBMITTED` dan user punya `report:review`.
   - Tombol `Mark reviewed` / `Need revision` / `Approve`.

4. **Activity timeline** (baru, komponen `ActivityTimeline`).
   - Kartu di bawah, list event dari `report_activities` desc.
   - Tiap baris: avatar actor, label aksi (translasi ID), timestamp, dan ringkasan field changed (jika action `EDITED`).
   - Bisa dibuka/tutup (collapsed default jika >5 entry).

5. Section konten existing (Summary / Metrics / Production incidents / Plan & notes) tetap.

### 6.3 Create & edit page

- Form sama seperti sekarang.
- Setelah create: redirect ke detail. Snapshot author dibuat di server-action.
- Setelah edit di status PENDING_QA_APPROVAL: tampilkan banner peringatan di form "Mengedit akan membatalkan approval QA yang sudah ada" sebelum submit. Setelah save, status balik ke DRAFT.

### 6.4 Button labels & states

| Status | Button | Action |
|--------|--------|--------|
| DRAFT | `Edit`, `Ajukan untuk approval QA` | Edit draft, request internal approval |
| PENDING_QA_APPROVAL | `Edit`, `Approve`, `Revoke approval` (di panel) | Edit (turun ke DRAFT), approve/revoke internal |
| SUBMITTED | (none for co-author) | Locked, waiting reviewer |
| REVIEWED | (none for co-author, reviewer can approve) | Reviewer approve |
| NEED_REVISION | `Edit` (turun ke DRAFT saat save) | Edit, reset approval |
| APPROVED | (none) | Terminal, read-only |

### 6.5 Toast / notification

- Saat auto-submit ke reviewer berhasil: toast "Approval QA lengkap. Report dikirim ke reviewer."
- Saat edit di PENDING_QA_APPROVAL: toast "Approval QA dibatalkan karena ada perubahan konten."
- Sortir default di list: status urgency (PENDING_QA_APPROVAL & NEED_REVISION yang relevan ke user di atas).

## 7. File Impact

### 7.1 Drizzle migration

New file: `drizzle/0004_collaborative_weekly_reports.sql`

Operations:
1. `ALTER TYPE report_status ADD VALUE 'PENDING_QA_APPROVAL'` (di luar transaction).
2. `ALTER TABLE weekly_reports ADD COLUMN created_by uuid REFERENCES users(id)`.
3. `ALTER TABLE weekly_reports ADD COLUMN submitted_by uuid REFERENCES users(id)`.
4. Backfill: `UPDATE weekly_reports SET created_by = user_id, submitted_by = CASE WHEN status IN ('SUBMITTED','REVIEWED','NEED_REVISION','APPROVED') THEN user_id ELSE NULL END`.
5. `ALTER TABLE weekly_reports ALTER COLUMN created_by SET NOT NULL`.
6. `DROP INDEX weekly_reports_project_user_week_unique`.
7. `CREATE UNIQUE INDEX weekly_reports_project_week_unique ON weekly_reports(project_id, week_start_date, week_end_date)`.
   - Risk: jika ada duplikat (project, week) milik QA berbeda, index gagal. Mitigasi: pre-check script yang gabungkan duplikat manual sebelum migrate.
8. `ALTER TABLE weekly_reports DROP COLUMN user_id`.
9. Create tables: `report_authors`, `report_qa_approvals`, `report_activities`.
10. Backfill `report_authors`: `INSERT INTO report_authors (weekly_report_id, user_id, assignment_role, added_at) SELECT id, created_by, 'QA_MEMBER', created_at FROM weekly_reports`.
11. Backfill `report_qa_approvals`: untuk report status SUBMITTED/REVIEWED/NEED_REVISION/APPROVED, insert satu approval untuk creator dengan `approved_at = submitted_at`.
12. Backfill `report_activities`: minimum `CREATED` event untuk tiap report; mapping `report_feedbacks` lama → `report_activities` (action mengikuti enum lama).

### 7.2 Schema (src/db/schema.ts)

- `reportStatusEnum` tambah `'PENDING_QA_APPROVAL'`.
- `weeklyReports` table:
  - Drop `userId`, tambah `createdBy`, `submittedBy`.
  - Update index dari `(projectId, userId, weekStartDate, weekEndDate)` ke `(projectId, weekStartDate, weekEndDate)`.
- New tables: `reportAuthors`, `reportQaApprovals`, `reportActivities`.
- Relations update:
  - `weeklyReportsRelations`: hilangkan `user` (author tunggal), tambah `authors`, `approvals`, `activities`, `creator`, `submitter`.
  - New relations: `reportAuthorsRelations`, `reportQaApprovalsRelations`, `reportActivitiesRelations`.
- `reportFeedbacks` & relasinya: tetap untuk read-only kompat, tambah komentar `@deprecated`.

### 7.3 Lib layer

- `src/lib/weekly-reports/transitions.ts`:
  - Tambah `canStartQaApproval(status: ReportStatus)` — true saat DRAFT.
  - Tambah `canApproveAsCoAuthor(status: ReportStatus, isCoAuthor: boolean, hasApproved: boolean)` — true saat PENDING_QA_APPROVAL dan user adalah co-author yang belum approve.
  - Tambah `canRevokeApproval(status: ReportStatus, isCoAuthor: boolean, hasApproved: boolean)` — true saat PENDING_QA_APPROVAL dan user sudah approve.
  - Refactor `canSubmitReport` — rename jadi `canStartQaApproval` (untuk co-author) dan `canReviewReport` tetap untuk reviewer.
- `src/lib/weekly-reports/rules.ts`:
  - Tambah `isContentField(fieldName: string): boolean` — cek apakah field termasuk konten (trigger reset approval).
  - Tambah `detectContentChanges(prev: Partial<WeeklyReport>, next: Partial<WeeklyReport>): string[]` — return array nama field yang berubah (dari content fields).
- `src/lib/weekly-reports/queries.ts`:
  - Refactor `listReportsByUser` → `listReportsByCoAuthorOrReviewer(userId)` — join `report_authors`.
  - Refactor `listAllReports` — join `report_authors` (aggregate count).
  - Refactor `getReportById` — include `creator` dan `submitter` nama.
  - New query: `getReportAuthors(weeklyReportId: string)` — return semua author + approval status.
  - New query: `getReportQaApprovals(weeklyReportId: string)`.
  - New query: `getReportActivities(weeklyReportId: string)` — return semua activity, join users untuk nama.
- `src/lib/weekly-reports/actions.ts`:
  - Refactor `createDraftAction`:
    - Snapshot author dari semua QA aktif di project (via `findActiveAssignment` semua QA).
    - Insert `weekly_reports` dengan `createdBy = user.id`.
    - Insert semua author ke `report_authors`.
    - Insert activity `CREATED`.
  - Refactor `updateDraftAction`:
    - Cek `isCoAuthor(id, user.id)` bukan `userId`.
    - Hitung `changedFields` via `detectContentChanges`.
    - Reset approvals + status DRAFT (dari PENDING/NEED_REVISION).
    - Insert activity `EDITED` + `QA_APPROVAL_REVOKED` (jika ada delete).
  - Refactor `submitReportAction` → `requestQaApprovalAction`:
    - Validasi readiness (`validateSubmitReadiness`).
    - Update status ke `PENDING_QA_APPROVAL`.
    - Insert activity `QA_APPROVAL_REQUESTED`.
- New file: `src/lib/weekly-reports/co-author-actions.ts`:
  - `approveAsCoAuthorAction(id: string)`:
    - Check `isCoAuthor` dan `canApproveAsCoAuthor`.
    - Insert ke `report_qa_approvals`.
    - Jika approval count == author count → auto-submit ke reviewer.
    - Insert activity `QA_APPROVED`.
  - `revokeMyApprovalAction(id: string)`:
    - Check `canRevokeApproval`.
    - Delete row dari `report_qa_approvals`.
    - Insert activity `QA_APPROVAL_REVOKED` (actor sendiri).
- `src/lib/reviews/actions.ts`:
  - `requestRevisionAction`: reset approvals (delete all), update status ke NEED_REVISION, insert activity `REVISION_REQUESTED`.
  - `approveReportAction`: insert activity `APPROVED`.
  - `markReviewedAction`: insert activity `REVIEWED`.
- New file: `src/lib/weekly-reports/activity.ts`:
  - Helper `insertActivity(weeklyReportId, actorId, action, changedFields?, note?)`.
  - Action enum const: `ACTIVITY_ACTIONS = { CREATED, EDITED, QA_APPROVAL_REQUESTED, QA_APPROVED, QA_APPROVAL_REVOKED, SUBMITTED_TO_REVIEWER, REVIEWED, REVISION_REQUESTED, APPROVED }`.

### 7.4 UI components

- New: `src/components/reports/co-authors-panel.tsx`:
  - Props: `authors` (array dengan approval status), `currentUserApprovable`, `currentUserRevokable`.
  - Render list author dengan badge approval.
  - Tombol `Approve` / `Revoke approval` untuk current user (client component, call server action).
- New: `src/components/reports/activity-timeline.tsx`:
  - Props: `activities` (array dengan actor name).
  - Render timeline event dengan icon, label, timestamp, changed fields (collapsible).
- Modify: `src/components/reports/weekly-report-columns.tsx`:
  - Tambah kolom "Co-authors" (avatar list) dan "Submitted by" (conditional).
- Modify: `src/components/reports/weekly-report-form.tsx`:
  - Banner peringatan saat edit di status PENDING_QA_APPROVAL.
- Modify: `src/components/reports/submit-report-button.tsx`:
  - Relabel jadi "Ajukan untuk approval QA".
  - Conditional: hide jika status bukan DRAFT atau user bukan co-author.
- New: `src/components/reports/qa-approval-button.tsx` (client component):
  - Button dengan confirm dialog, call `approveAsCoAuthorAction` / `revokeMyApprovalAction`.
- Modify: `src/lib/reports/status.ts` (`reportStageDescription`):
  - Handle `PENDING_QA_APPROVAL` → "Menunggu approval internal QA (X/Y)".
  - Handle `SUBMITTED` → "Dikirim ke reviewer oleh [submitter]".
- Modify: `src/components/ui/status-badge.tsx`:
  - Tambah varian `PENDING_QA_APPROVAL`.

### 7.5 Page layer

- Modify: `src/app/(dashboard)/weekly-reports/page.tsx`:
  - Refactor query: gunakan `listReportsByCoAuthorOrReviewer` (bukan `listReportsByUser` / `listAllReports`).
  - Update `canEdit` rule: cek `isCoAuthor`.
- Modify: `src/app/(dashboard)/weekly-reports/[id]/page.tsx`:
  - Fetch authors, approvals, activities.
  - Tentukan `isCoAuthor`, `isReviewer`.
  - Render panel co-author + timeline.
  - Expand access rule: boleh akses jika co-author atau reviewer.
  - Replace `isOwner` dengan `isCoAuthor` di semua rule.
  - Tambah tombol "Ajukan untuk approval QA" (saat DRAFT).
- Modify: `src/app/api/monthly-reports/export/route.ts`:
  - Flag untuk adjust aggregator (out of scope, di-flag sebagai TODO).

## 8. Migration Strategy

### 8.1 Backfill data existing

Existing reports (single-author model) akan di-migrate jadi single-author single-approval:

- `created_by` dan `submitted_by` diisi dari `user_id` lama.
  - `submitted_by` hanya diisi jika status >= SUBMITTED.
- `report_authors`: 1 row per report (creator).
- `report_qa_approvals`:
  - Untuk report with status SUBMITTED/REVIEWED/NEED_REVISION/APPROVED: insert 1 approval untuk creator.
  - Untuk DRAFT: empty.
- `report_activities`:
  - Minimum: 1 event `CREATED` (actor = creator, created_at = createdAt report).
  - Map `report_feedbacks` lama → event `REVIEWED` / `REVISION_REQUESTED` / `APPROVED` dengan `note` berisi feedback teks.
  - `report_feedbacks` lama tetap di-preserve, tapi read-only setelah migrasi.

### 8.2 Rollback plan

Migration ini adalah forward-only. Jika ada issue:
- Drop new tables (`report_activities`, `report_qa_approvals`, `report_authors`).
- Restore `user_id` column dari `created_by`.
- Remove `PENDING_QA_APPROVAL` dari enum (jika tidak ada report dengan status itu).

### 8.3 Test migration

Sebelum deploy:
- Backup DB.
- Run migration di staging.
- Verify: unique index tidak conflict, backfill lengkap, activity log terbaca di UI.

## 9. Testing Strategy

### 9.1 Unit tests

- `src/lib/weekly-reports/rules.test.ts`:
  - `isContentField` — whitelist field konten.
  - `detectContentChanges` — return diff array.
- `src/lib/weekly-reports/transitions.test.ts`:
  - `canStartQaApproval`, `canApproveAsCoAuthor`, `canRevokeApproval`.
- Snapshot author: unit test untuk logic snapshot (1 QA, 2 QA, 0 QA → reject).

### 9.2 Action tests

- `src/lib/weekly-reports/actions.test.ts`:
  - `createDraftAction` — snapshot 1 / 2 / 3 QA, verify `report_authors` rows.
  - `updateDraftAction` — edit content field triggers reset approval + status DRAFT.
- `src/lib/weekly-reports/co-author-actions.test.ts` (new):
  - `approveAsCoAuthorAction` — approve pertama (tidak auto-submit), approve terakhir (auto-submit + verify `submitted_by`).
  - `revokeMyApprovalAction` — revoke saat PENDING_QA_APPROVAL.
  - Edge: approve saat belum co-author → error; revoke saat belum approve → error.

Coverage target: snapshot semua 9 cabang state machine (DRAFT, PENDING_QA_APPROVAL, SUBMITTED, REVIEWED, NEED_REVISION, APPROVED, plus edge transitions).

### 9.3 Integration tests

- Test action layer dengan in-memory drizzle (project sudah punya pola di `actions.test.ts`).
- Test `detectContentChanges` dengan fixture data berbeda.

### 9.4 E2E tests (Playwright)

- `e2e/weekly-reports.spec.ts` (extend):
  - Skenario 1: project 2-QA, QA A create draft, ajukan approval, QA A approve, QA B approve → auto SUBMITTED, lead approve → APPROVED.
  - Skenario 2: edit reset approval — QA A create, ajukan, QA A approve, QA B edit → approval QA A reset, status DRAFT.
  - Skenario 3: single-QA project tetap jalan (snapshot 1 author, approve sendiri → auto-submit).
  - Skenario 4: revision flow — lead minta revision → NEED_REVISION, QA edit → DRAFT, ajukan lagi, approve → SUBMITTED, lead approve → APPROVED.

### 9.5 Verification akhir

Sebelum claim complete:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run e2e`

Semua harus pass 100%.

## 10. Out-of-Scope Flags

Items berikut di-flag untuk ditangani di iterasi berikutnya:

1. **Monthly report aggregator** — perlu disesuaikan untuk menggunakan snapshot `report_authors` (bukan `userId`). Ditangani sebagai task terpisah setelah fitur ini stable.
2. **Manual add/remove co-author** — setelah snapshot dibuat, tidak ada mekanisme untuk menambah/mengeluarkan co-author. Jika QA baru di-assign tengah minggu, dia tidak otomatis jadi co-author untuk report yang sudah jalan.
3. **Notifikasi** — email/realtime notification saat butuh approval, saat report disubmit, saat reviewer minta revision.
4. **Versioned snapshots / diff isi** — feature log hanya event-level, bukan full revision history dengan side-by-side diff.
5. **Activity log granularity** — event log mencatat field yang berubah (nama field), bukan before/after value.

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Migration gagal karena duplicate (project, week) milik QA berbeda | Pre-check script sebelum migrate; fail-fast di dev OK |
| Approval reset terlalu agresif bikin loop | Banner warning di UI; confirmation dialog |
| Co-author yang sudah pindah project masih bisa approve | By design: snapshot sekali, tidak berubah |
| Monthly report aggregator tidak konsisten | Flag sebagai OOS; di-handle di task terpisah |
