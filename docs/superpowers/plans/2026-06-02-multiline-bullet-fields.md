# Multiline Bullet Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users press Enter inside the same bullet field to create a newline instead of a new bullet row.

**Architecture:** Store new bullet-list values as a JSON string array so each bullet can contain internal newlines. Preserve backward compatibility by parsing legacy newline-delimited values as separate bullets.

**Tech Stack:** React, Next.js App Router, Vitest, TypeScript.

---

### Task 1: Bullet Value Helpers

**Files:**
- Create: `src/lib/reports/bullets.ts`
- Test: `src/lib/reports/bullets.test.ts`

- [ ] Write tests for JSON array storage preserving internal newlines.
- [ ] Write tests for legacy newline-delimited values.
- [ ] Run targeted tests and confirm RED.
- [ ] Implement `parseBulletItems`, `serializeBulletItems`, and `formatMarkdownBullet`.
- [ ] Run targeted tests and confirm GREEN.

### Task 2: Form Input

**Files:**
- Modify: `src/components/ui/bullet-list-input.tsx`

- [ ] Replace per-row `Input` with `Textarea`.
- [ ] Use `serializeBulletItems(rows)` for hidden value.
- [ ] Use `parseBulletItems(defaultValue)` for defaults.
- [ ] Leave `Add row` as the only way to create a new bullet.

### Task 3: Display And Export

**Files:**
- Modify: `src/app/(dashboard)/weekly-reports/[id]/page.tsx`
- Modify: `src/lib/monthly-reports/queries.ts`
- Modify: `src/lib/monthly-reports/export-markdown.ts`
- Test: `src/lib/monthly-reports/export-markdown.test.ts`

- [ ] Parse bullet JSON for weekly detail display.
- [ ] Flatten parsed blockers and next plans in monthly summary.
- [ ] Format multiline bullets in Markdown with indented continuation lines.
- [ ] Verify export tests.

### Task 4: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
