# QA Management App

Boilerplate MVP untuk mengelola QA member, project assignment, weekly report, review flow, dashboard, dan monthly summary.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL 16
- Zod
- Docker Compose

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
- `npm run e2e` - Playwright E2E tests
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
src/lib/auth            Auth helpers
src/db                  Drizzle schema, client, and seed
src/lib/permissions     Role permission matrix
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
5. Weekly report CRUD and submit flow
6. Review, feedback, revision, approval flow
7. Dashboard metrics
8. Monthly summary and Markdown export
