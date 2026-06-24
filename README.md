# QA Management App

Internal QA workflow app untuk mengelola QA member, project assignment, collaborative weekly report, review flow, dashboard operasional, monthly summary, dan Markdown export.

## Current Features

- Role-based auth untuk Admin, QA Lead, dan QA Member.
- Project CRUD, archive/restore, dan assignment QA member.
- Weekly report kolaboratif per project/minggu dengan instant draft on create, duplicate guard, dan co-author snapshot.
- Internal QA approval sebelum report otomatis terkirim ke reviewer.
- Review flow: mark reviewed, request revision, approve, feedback history, dan activity timeline.
- Dashboard role-aware dengan date range filter berbasis URL.
- Dashboard lead: pending review, need revision, approved, incident total, dan coverage per project dengan search/pagination.
- Dashboard member: assigned projects, pending approval, need revision, approved, dan recent reports.
- Monthly report summary dari approved weekly report.
- Markdown export untuk monthly report.

## Weekly Report Creation Flow

1. QA klik `New report` atau `Create` dari checklist dashboard.
2. QA memilih project dan week.
3. Klik `Create report` langsung membuat draft awal berstatus `DRAFT` untuk kombinasi project/week tersebut.
4. Sistem melakukan snapshot co-author dari QA aktif di project dan redirect ke halaman edit draft.
5. QA lain yang memilih project/week yang sama akan melihat report existing beserta pembuat dan statusnya; create duplicate dicegah.
6. Field wajib boleh kosong pada draft awal, tetapi harus valid sebelum report dapat diajukan ke approval QA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Radix UI primitives
- React DayPicker
- Drizzle ORM
- PostgreSQL 16
- Zod
- Docker Compose

## Run with Docker

Production uses `.env.prod` as the environment source and connects to an
external PostgreSQL database through `DATABASE_URL`, `DATABASE_URL_TAILSCALE`,
or `DATABASE_URL_LAN`.

```bash
# Build and start (migrations run automatically on boot)
npm run prod:up

# Logs
npm run prod:logs

# Stop
npm run prod:down

# App: http://localhost:3000
```

Required `.env.prod` values:

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | empty | Optional explicit DB URL |
| `DATABASE_URL_TAILSCALE` | empty | Preferred homeserver DB URL |
| `DATABASE_URL_LAN` | empty | LAN fallback DB URL |
| `APP_URL` | empty | Public app URL |
| `APP_PORT` | empty | Host port mapped to container 3000 |
| `SESSION_SECRET` | empty | Required in production |
| `DEFAULT_USER_PASSWORD` | empty | Initial password for new users and seeded superadmin |
| `SEED_ON_START` | `false` | Keep false in production |
| `ADMIN_EMAIL` | empty | Used by initial setup seed |
| `ADMIN_NAME` | empty | Used by initial setup seed |

The image uses Next.js standalone output (multi-stage build). The entrypoint
(`docker-entrypoint.sh`) resolves `DATABASE_URL` from the env above, runs
`drizzle-kit migrate`, then starts the server.

Initial setup for an empty production database:

```bash
# Run once only. This truncates all data, creates the superadmin, and seeds
# the initial project list.
npm run db:clean-admin
```

The seeded superadmin uses `DEFAULT_USER_PASSWORD` as the initial password and
must change it on first login.

Do not set `SEED_ON_START=true` for production restarts.

## Setup Local

1. Install dependencies:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Start database:

```bash
docker compose up -d
```

4. Resolve homeserver DB:

```bash
npm run db:resolve
```

5. Generate Drizzle migration:

```bash
npm run db:generate
```

6. Apply migration:

```bash
npm run db:migrate
```

7. Seed data:

```bash
npm run db:seed
```

8. Start Drizzle Studio:

```bash
npm run db:studio
```

9. Start dev server:

```bash
npm run dev
```

## Seed Accounts

- `jopa@example.com` / `password123` / `ADMIN`
- `lead@example.com` / `password123` / `QA_LEAD`
- `qa1@example.com` / `password123` / `QA_MEMBER` (must change password)
- `qa2@example.com` / `password123` / `QA_MEMBER` (must change password)

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - lint
- `npm run typecheck` - TypeScript check
- `npm run test` - Vitest unit tests
- `npm run e2e` - Playwright E2E tests. Run only against a disposable/seeded DB because global setup may reset test data.
- `npm run db:resolve` - choose Tailscale DB first, then LAN fallback
- `npm run db:generate` - generate Drizzle migration
- `npm run db:migrate` - run Drizzle migration
- `npm run db:push` - push schema directly when needed
- `npm run db:studio` - open Drizzle Studio
- `npm run db:studio:stop` - stop Drizzle Studio (free port 4983)
- `npm run db:seed` - seed initial data
- `npm run db:reset:home` - drop & recreate `public` + `drizzle` schemas

## CI Pipeline

Run in this order:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
# E2E (requires running dev server + seeded DB):
npm run dev &
npx wait-on http://localhost:3000
npm run e2e
```

## Structure

```txt
src/app                 App Router pages/layouts
src/components/ui       Shared UI primitives
src/components/layout   App shell components
src/components/dashboard Dashboard widgets and date range controls
src/components/reports  Weekly report UI and review components
src/lib/auth            Auth helpers
src/db                  Drizzle schema, client, and seed
src/lib/dashboard       Dashboard queries, date range parsing, presets
src/lib/permissions     Role permission matrix
src/lib/weekly-reports  Weekly report actions, transitions, co-author approvals
src/lib/reports         Report calculation helpers
src/lib/validations     Zod schemas
src/types               Shared app types
drizzle                 Generated Drizzle migrations
```

## Build Priority

1. Auth implementation and role guard
2. Project CRUD
3. User CRUD
4. Project member assignment
5. Collaborative weekly report CRUD and QA approval flow
6. Review, feedback, revision, approval flow
7. Dashboard metrics and date range filtering
8. Monthly summary and Markdown export
