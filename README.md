# QA Management App

Internal QA workflow app untuk mengelola QA member, project assignment, collaborative weekly report, review flow, dashboard operasional, monthly summary, dan Markdown export.

## Current Features

- Role-based auth untuk Admin, QA Lead, dan QA Member.
- Project CRUD, archive/restore, dan assignment QA member.
- Weekly report kolaboratif per project/minggu dengan co-author snapshot.
- Internal QA approval sebelum report otomatis terkirim ke reviewer.
- Review flow: mark reviewed, request revision, approve, feedback history, dan activity timeline.
- Dashboard role-aware dengan date range filter berbasis URL.
- Dashboard lead: pending review, need revision, approved, incident total, dan coverage per project dengan search/pagination.
- Dashboard member: assigned projects, pending approval, need revision, approved, dan recent reports.
- Monthly report summary dari approved weekly report.
- Markdown export untuk monthly report.

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

Full stack (PostgreSQL + app) via Docker Compose:

```bash
# Build and start (migrations run automatically on boot)
docker compose up -d --build

# First run: also seed initial users/projects
SEED_ON_START=true docker compose up -d --build

# App: http://localhost:3000
# Stop + remove volumes
docker compose down -v
```

Environment overrides (optional, via shell or `.env` next to compose):

| Var | Default | Notes |
|---|---|---|
| `POSTGRES_DB` | `qa_management` | Database name |
| `POSTGRES_USER` | `qa_user` | DB user |
| `POSTGRES_PASSWORD` | `qa_password` | DB password |
| `POSTGRES_PORT` | `5433` | Host port mapped to container 5432 |
| `SESSION_SECRET` | `change-me-in-production` | Set a strong value in prod |
| `DEFAULT_USER_PASSWORD` | `password123` | Default password for new users |
| `SEED_ON_START` | `false` | Seed DB on container start |

The image uses Next.js standalone output (multi-stage build). The entrypoint
(`docker-entrypoint.sh`) runs `drizzle-kit migrate` before starting the server,
and seeds when `SEED_ON_START=true`.

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
