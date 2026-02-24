# CI Pipeline & Code Quality Design

**Goal:** GHA CI workflow + pre-commit hooks + comprehensive ESLint + Prettier for code quality enforcement.

## ESLint

**Base:** `next/core-web-vitals` (existing)

**Added plugins:**
- `eslint-plugin-unicorn` — Modern JS patterns (prefer IIFE, const, template literals, Array methods, optional chaining)
- `@typescript-eslint/strict-type-checked` — No unsafe any (warn), no floating promises, consistent type imports, prefer nullish coalescing
- `eslint-plugin-import` — Import ordering, no duplicates
- `eslint-config-prettier` — Disables formatting rules that conflict with Prettier

**Key overrides for Next.js compatibility:**
- `unicorn/filename-case` — off (Next.js requires page.tsx, layout.tsx, [id])
- `unicorn/prevent-abbreviations` — off (too aggressive)
- `@typescript-eslint/no-explicit-any` — warn (gradual migration)

## Prettier

- Double quotes, semicolons, print width 100, trailing commas `all`, tab width 2

## Pre-commit Hooks

- `husky` + `lint-staged`
- On commit: `prettier --write` + `eslint --fix` on staged .ts/.tsx files only

## GHA Workflow

Single job on PRs to `main` and pushes to `main`:
1. Checkout + Node 18 + npm cache
2. `npm ci`
3. `npm run format:check`
4. `npm run lint`
5. `npm run typecheck`
6. `npm run build` (with dummy Supabase env vars)

## npm Scripts

- `format` — `prettier --write .`
- `format:check` — `prettier --check .`
- `typecheck` — `tsc --noEmit`
