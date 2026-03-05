# Testing & CI Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add unit tests (vitest) and E2E tests (Playwright) to CI, with unit tests on every PR and E2E on merge to main only.

**Architecture:** Vitest for fast unit tests on pure utility functions. Playwright (already installed) for E2E against real Supabase. CI workflow split into `ci` job (lint + typecheck + unit tests + build on all PRs) and `e2e` job (Playwright on push to main only).

**Tech Stack:** Vitest, Playwright, GitHub Actions

---

### Task 1: Install Vitest and configure

**Files:**

- Modify: `package.json` (add vitest dep + test script)
- Create: `vitest.config.ts`

**Step 1: Install vitest**

Run: `pnpm add -D vitest`

**Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Add test script to package.json**

Add `"test": "vitest run"` to scripts.

**Step 4: Run to verify config works**

Run: `pnpm test`
Expected: "No test files found" (no error)

**Step 5: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: install vitest and add test config"
```

---

### Task 2: Unit tests — geo utilities

**Files:**

- Create: `src/lib/utils/__tests__/geo.test.ts`
- Source: `src/lib/utils/geo.ts`

**Tests to write:**

- `haversineDistance` — known distance between Cebu City and Manila (~565km)
- `haversineDistance` — same point returns 0
- `haversineDistance` — antipodal points (~20000km)
- `formatDistance` — values < 1km return "<1km"
- `formatDistance` — values >= 1km return "~Nkm" with rounding

**Step 1: Write tests**
**Step 2: Run tests — verify pass**

Run: `pnpm test src/lib/utils/__tests__/geo.test.ts`

**Step 3: Commit**

```bash
git add src/lib/utils/__tests__/geo.test.ts
git commit -m "test: add unit tests for geo utilities"
```

---

### Task 3: Unit tests — normalize mountain name

**Files:**

- Create: `src/lib/utils/__tests__/normalize-mountain-name.test.ts`
- Source: `src/lib/utils/normalize-mountain-name.ts`

**Tests to write:**

- `normalizeMountainName` — "Mt Apo" → "Mt. Apo"
- `normalizeMountainName` — "Mount Apo" → "Mt. Apo"
- `normalizeMountainName` — "mt. apo" → "Mt. Apo" (case normalization on prefix only)
- `normalizeMountainName` — "Mt.Apo" (no space) → "Mt. Apo"
- `normalizeMountainName` — extra whitespace trimmed
- `stripMountainPrefix` — "Mt. Loboc" → "loboc"
- `stripMountainPrefix` — "Mount Apo" → "apo"
- `stripMountainPrefix` — "Chocolate Hills" → "chocolate hills" (no prefix)

**Step 1: Write tests**
**Step 2: Run tests — verify pass**
**Step 3: Commit**

```bash
git add src/lib/utils/__tests__/normalize-mountain-name.test.ts
git commit -m "test: add unit tests for mountain name normalization"
```

---

### Task 4: Unit tests — event overlap

**Files:**

- Create: `src/lib/events/__tests__/overlap.test.ts`
- Source: `src/lib/events/overlap.ts`

**Tests to write:**

- `getEffectiveEnd` — with endDate returns endDate as Date
- `getEffectiveEnd` — without endDate returns 23:59:59.999 of same day
- `rangesOverlap` — overlapping ranges return true
- `rangesOverlap` — non-overlapping ranges return false
- `rangesOverlap` — touching boundaries (end equals start) return false (strict <)
- `findOverlappingEvent` — finds overlap in list
- `findOverlappingEvent` — returns null when no overlap
- `findOverlappingEvent` — excludes event by excludeEventId

**Step 1: Write tests**
**Step 2: Run tests — verify pass**
**Step 3: Commit**

```bash
git add src/lib/events/__tests__/overlap.test.ts
git commit -m "test: add unit tests for event overlap detection"
```

---

### Task 5: Unit tests — extractMentions + cdnUrl

**Files:**

- Create: `src/lib/feed/__tests__/mentions.test.ts`
- Create: `src/lib/__tests__/storage.test.ts`
- Source: `src/lib/feed/mentions.ts`, `src/lib/storage.ts`

**Tests for extractMentions:**

- Text with mentions → returns unique usernames without @
- No mentions → returns []
- Duplicate mentions → deduplicated
- Text with @username in middle of sentence

**Tests for cdnUrl:**

- null/undefined input → returns null
- Supabase storage URL → returns `/storage/...` path (mock `process.env.NEXT_PUBLIC_SUPABASE_URL`)
- R2 URL matching regex → returns `/r2/...` path
- Non-matching URL → returns URL unchanged

**Step 1: Write tests**
**Step 2: Run tests — verify pass**
**Step 3: Commit**

```bash
git add src/lib/feed/__tests__/mentions.test.ts src/lib/__tests__/storage.test.ts
git commit -m "test: add unit tests for mentions extraction and CDN URL"
```

---

### Task 6: Unit tests — cn utility

**Files:**

- Create: `src/lib/__tests__/utils.test.ts`
- Source: `src/lib/utils.ts`

**Tests to write:**

- Merges classes: `cn("foo", "bar")` → "foo bar"
- Handles conditional classes: `cn("foo", false && "bar")` → "foo"
- Merges conflicting Tailwind: `cn("px-2", "px-4")` → "px-4"
- Handles undefined/null gracefully

**Step 1: Write tests**
**Step 2: Run tests — verify pass**
**Step 3: Commit**

```bash
git add src/lib/__tests__/utils.test.ts
git commit -m "test: add unit tests for cn utility"
```

---

### Task 7: Fix Playwright config

**Files:**

- Modify: `playwright.config.ts`

**Changes:**

- `command`: `"npm run dev"` → `"pnpm dev"`
- `url` + `baseURL`: port `3000` → `3001`

**Step 1: Update config**
**Step 2: Commit**

```bash
git add playwright.config.ts
git commit -m "fix: update Playwright config to use pnpm and port 3001"
```

---

### Task 8: Add E2E specs — events listing + event detail

**Files:**

- Create: `e2e/events.spec.ts`

**Tests to write:**

- Events listing page loads and shows event cards
- Events page has working filter/category navigation
- Clicking an event card navigates to event detail page
- Event detail page shows title, date, location, booking count

**Step 1: Write tests**
**Step 2: Run locally to verify**

Run: `pnpm test:e2e e2e/events.spec.ts`

**Step 3: Commit**

```bash
git add e2e/events.spec.ts
git commit -m "test: add E2E specs for events listing and detail pages"
```

---

### Task 9: Add E2E specs — auth pages + navigation

**Files:**

- Create: `e2e/auth.spec.ts`
- Create: `e2e/navigation.spec.ts`

**auth.spec.ts tests:**

- Login page loads and shows form
- Signup page loads and shows form
- Login page has link to signup and vice versa

**navigation.spec.ts tests:**

- Navbar logo links to homepage
- Explore link navigates to events
- Navigation between pages works (homepage → events → back)

**Step 1: Write tests**
**Step 2: Run locally to verify**
**Step 3: Commit**

```bash
git add e2e/auth.spec.ts e2e/navigation.spec.ts
git commit -m "test: add E2E specs for auth pages and navigation"
```

---

### Task 10: Update CI workflow

**Files:**

- Modify: `.github/workflows/ci.yml`

**Changes to existing `ci` job:**

- Add `pnpm test` step after "Type check" and before "Build"

**Add new `e2e` job:**

- Triggers only on `push: branches: [main]` (not PRs)
- Steps: checkout → pnpm setup → node setup → install deps → install Playwright browsers → run `pnpm test:e2e`
- Needs env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from GitHub secrets
- Upload Playwright report as artifact on failure

**Step 1: Update ci.yml**
**Step 2: Verify YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add unit tests to PR checks and E2E on merge to main"
```

---

### Task 11: Run full verification

**Step 1:** `pnpm test` — all unit tests pass
**Step 2:** `pnpm run format:check` — formatting OK
**Step 3:** `pnpm lint` — no lint errors
**Step 4:** `pnpm typecheck` — no type errors
**Step 5:** `pnpm build` — build succeeds

---

### Post-merge: GitHub Secrets

After merging, add these secrets in **GitHub repo → Settings → Secrets → Actions**:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
