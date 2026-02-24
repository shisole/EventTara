# CI Pipeline & Code Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up GHA CI workflow, ESLint with strict rules, Prettier, and pre-commit hooks.

**Architecture:** Install and configure linting/formatting tools, create GHA workflow, add pre-commit hooks. Then fix all existing lint/format violations so CI passes on the first run.

**Tech Stack:** ESLint 8, Prettier, eslint-plugin-unicorn, @typescript-eslint (strict-type-checked), eslint-plugin-import, eslint-config-prettier, husky, lint-staged

---

### Task 1: Install dependencies

**Files:**

- Modify: `package.json`

**Steps:**

1. Install dev dependencies:
   ```bash
   npm install -D prettier eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import @typescript-eslint/parser @typescript-eslint/eslint-plugin husky lint-staged
   ```
2. Add npm scripts to `package.json`:
   - `"format": "prettier --write ."`
   - `"format:check": "prettier --check ."`
   - `"typecheck": "tsc --noEmit"`
3. Add `lint-staged` config to `package.json`:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
     "*.{json,md,css}": ["prettier --write"]
   }
   ```
4. Commit: `chore: install CI and code quality dependencies`

---

### Task 2: Configure Prettier

**Files:**

- Create: `.prettierrc.json`
- Create: `.prettierignore`

**Steps:**

1. Create `.prettierrc.json`:
   ```json
   {
     "semi": true,
     "singleQuote": false,
     "tabWidth": 2,
     "trailingComma": "all",
     "printWidth": 100,
     "bracketSpacing": true
   }
   ```
2. Create `.prettierignore`:
   ```
   node_modules
   .next
   out
   coverage
   pnpm-lock.yaml
   package-lock.json
   yarn.lock
   *.generated.ts
   ```
3. Verify: `npx prettier --check src/` (expect failures — existing code not yet formatted)
4. Commit: `chore: add Prettier config`

---

### Task 3: Configure ESLint

**Files:**

- Modify: `.eslintrc.json`

**Steps:**

1. Update `.eslintrc.json` with:
   - `extends`: `next/core-web-vitals`, `plugin:@typescript-eslint/strict-type-checked`, `plugin:@typescript-eslint/stylistic-type-checked`, `plugin:unicorn/recommended`, `plugin:import/recommended`, `plugin:import/typescript`, `prettier`
   - `parser`: `@typescript-eslint/parser`
   - `parserOptions`: `project: true`, `tsconfigRootDir: __dirname`
   - `plugins`: `@typescript-eslint`, `unicorn`, `import`
   - `rules` — key overrides:
     - `unicorn/filename-case`: off
     - `unicorn/prevent-abbreviations`: off
     - `unicorn/no-null`: off (Supabase returns null everywhere)
     - `unicorn/no-array-reduce`: off (used in review aggregation)
     - `@typescript-eslint/no-explicit-any`: warn
     - `@typescript-eslint/no-unsafe-assignment`: warn
     - `@typescript-eslint/no-unsafe-member-access`: warn
     - `@typescript-eslint/no-unsafe-argument`: warn
     - `@typescript-eslint/no-unsafe-return`: warn
     - `@typescript-eslint/no-unsafe-call`: warn
     - `@typescript-eslint/no-misused-promises`: off (Next.js form actions/event handlers)
     - `@typescript-eslint/consistent-type-imports`: error (enforce `import type {}`)
     - `@typescript-eslint/prefer-nullish-coalescing`: warn
     - `import/order`: error with groups `[builtin, external, internal, parent, sibling, index]`, newlines between groups
     - `import/no-duplicates`: error
   - `settings.import/resolver.typescript`: true
   - `ignorePatterns`: `node_modules`, `.next`, `out`, `scripts`
2. Verify: `npm run lint` (expect many warnings/errors from existing code)
3. Commit: `chore: configure ESLint with strict rules`

---

### Task 4: Set up husky + pre-commit hook

**Files:**

- Create: `.husky/pre-commit`
- Modify: `package.json` (prepare script)

**Steps:**

1. Add prepare script: `"prepare": "husky"` in package.json
2. Run `npx husky init`
3. Write `.husky/pre-commit`:
   ```bash
   npx lint-staged
   ```
4. Verify: make a small change, `git add`, `git commit` — lint-staged should run
5. Commit: `chore: add husky pre-commit hook with lint-staged`

---

### Task 5: Create GHA workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Steps:**

1. Create `.github/workflows/ci.yml`:
   - Trigger: `pull_request` to `main`, `push` to `main`
   - Single job `ci` on `ubuntu-latest`
   - Steps: checkout, setup-node@v4 (node 18, npm cache), `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`
   - `env` for build step: `NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"`, `NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"`
2. Commit: `ci: add GitHub Actions CI workflow`

---

### Task 6: Fix existing code — Prettier formatting

**Files:**

- Modify: all `.ts`, `.tsx`, `.json`, `.md`, `.css` files

**Steps:**

1. Run `npm run format` to auto-fix all formatting
2. Verify: `npm run format:check` passes
3. Commit: `style: format entire codebase with Prettier`

---

### Task 7: Fix existing code — ESLint violations

**Files:**

- Modify: various `src/` files

**Steps:**

1. Run `npm run lint -- --fix` to auto-fix what ESLint can
2. Run `npm run lint` to see remaining issues
3. Fix remaining issues manually (likely `import type`, nullish coalescing, etc.)
4. If too many `any`-related warnings from Supabase types that can't be removed, adjust rules to `warn` or add inline `// eslint-disable` where truly necessary (e.g. Supabase relationship casts)
5. Verify: `npm run lint` passes clean
6. Commit: `fix: resolve ESLint violations across codebase`

---

### Task 8: Final verification

**Steps:**

1. Run full CI locally:
   ```bash
   npm run format:check && npm run lint && npm run typecheck && npm run build
   ```
2. All four must pass
3. Commit any remaining fixes
4. Push and verify GHA workflow runs green
