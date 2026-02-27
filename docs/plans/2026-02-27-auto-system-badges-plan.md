# Auto System Badges Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 11 automatic platform-level badges awarded on check-in based on participant activity.

**Architecture:** Extend the existing `badges` table with a `type` column to support system badges alongside event badges. Evaluation logic follows the `checkAndAwardBorders` pattern — non-blocking, triggered on check-in, 2-3 queries. New `/achievements` page shows earned/locked badges.

**Tech Stack:** Next.js 15 App Router, Supabase, Resend (email), Tailwind CSS

---

### Task 1: Database Migration — Add columns to badges table

**Files:**

- Create: `supabase/migrations/add_system_badge_columns.sql`
- Modify: `src/lib/supabase/types.ts:411-451` (badges Row/Insert/Update types)

Add `type` column (`'event' | 'system'`, default `'event'`) and `criteria_key` column (`text | null`, unique when not null) to the `badges` table. Update the hand-maintained TypeScript types to match. Run migration against Supabase.

**Commit:** `feat: add type and criteria_key columns to badges table`

---

### Task 2: System Badge Definitions

**Files:**

- Create: `src/lib/constants/system-badges.ts`

Define all 11 system badges as a typed constant array. Each entry: `criteriaKey`, `title`, `description`, `category`, `rarity`, `imageUrl` (emoji string for now). Export the array and a `SYSTEM_BADGE_KEYS` set for lookups.

Badge list: `first_hike`, `first_run`, `first_road_ride`, `first_mtb`, `first_trail_run`, `all_rounder`, `events_5`, `events_10`, `events_25`, `events_50`, `pioneer`.

Reference `src/lib/constants/badge-templates.ts` for the existing template pattern.

**Commit:** `feat: define 11 system badge constants`

---

### Task 3: Badge Evaluation Logic

**Files:**

- Create: `src/lib/badges/check-system-badges.ts`

Follow the `src/lib/borders/check-borders.ts` pattern exactly. Create `checkAndAwardSystemBadges(userId, supabase)`:

1. Parallel fetch: user's check-in stats (total count, count per event type via `COUNT(*) FILTER`, earliest check-in) + user's existing system badge `criteria_key`s
2. For Pioneer: count distinct users whose first check-in is before this user's (only if user doesn't already have Pioneer)
3. Evaluate all 11 criteria against stats
4. Filter to only newly earned badges
5. Bulk upsert `user_badges` rows
6. Return array of newly awarded badge details (for email)

Make function non-blocking safe (catch all errors, log them).

**Commit:** `feat: add system badge evaluation logic`

---

### Task 4: Batched Badge Email Template

**Files:**

- Create: `src/lib/email/templates/badges-earned.ts`

New template for batched badge awards. When 1 badge: similar to existing `badge-awarded.ts` but with CTA to `/achievements`. When multiple: "You earned N new badges!" header with a grid/list of all badge images + titles. Single CTA: "View Your Achievements" → `/achievements`.

Reference existing template at `src/lib/email/templates/badge-awarded.ts` for styling patterns (cream background, gold+teal header, forest green CTA).

**Commit:** `feat: add batched badge email template`

---

### Task 5: Check-in API Integration

**Files:**

- Modify: `src/app/(frontend)/api/checkins/route.ts:3,105` (add import + call)

After the existing `checkAndAwardBorders(userId, supabase)` call at line 105, add a non-blocking `checkAndAwardSystemBadges(userId, supabase)` call. Same fire-and-forget pattern. After evaluation, if any badges were newly awarded, send the batched email using the template from Task 4.

**Commit:** `feat: trigger system badge evaluation on check-in`

---

### Task 6: Update BadgeCard for System Badges

**Files:**

- Modify: `src/components/badges/BadgeCard.tsx:8-16` (props interface — make eventName optional)
- Modify: `src/components/badges/BadgeCard.tsx:45-50` (render — show "System Achievement" when no eventName)

Handle `eventName` being undefined/null for system badges. Display "System Achievement" or similar label instead of event name. Keep everything else the same.

**Commit:** `feat: handle system badges in BadgeCard`

---

### Task 7: Update Badge Detail Page

**Files:**

- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx:65-69` (fetch — handle null event)
- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx` (render — conditionally show event section)

Skip the "Event" section when `events` is null (system badges). Show badge description, rarity, category, and participant list as normal.

**Commit:** `feat: handle system badges on badge detail page`

---

### Task 8: Filter Dashboard Badge Management

**Files:**

- Modify: `src/components/dashboard/BadgeForm.tsx` (if it queries existing badges, add `type = 'event'` filter)
- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx` (badge fetch — add type filter)

Ensure organizer dashboard only shows/manages event badges. System badges should not appear in the badge form or event dashboard.

**Commit:** `feat: filter system badges from organizer dashboard`

---

### Task 9: Achievements Page

**Files:**

- Create: `src/app/(frontend)/(participant)/achievements/page.tsx`

Server component. Auth required (redirect to login if not authenticated).

Fetch: all system badges from `badges` table (`WHERE type = 'system'`) + user's earned system badges from `user_badges`.

Display: responsive grid of all 11 system badges. Earned badges = full color + "Earned on [date]". Locked badges = grayscale/dimmed + criteria hint text (e.g., "Check in to your first hiking event"). Progress counter at top: "X / 11 badges earned".

Use existing `RARITY_STYLES` and `CATEGORY_STYLES` from `src/lib/constants/badge-rarity.ts`. Reference `BadgeCard` styling but adapt for earned/locked states.

Add link to achievements page from profile badge section.

**Commit:** `feat: add achievements page with earned/locked badge grid`

---

### Task 10: Seed Script Updates

**Files:**

- Modify: `scripts/seed.ts:1898-2150` (add system badge seeding)

Add to `createBadges` function: insert 11 system badge rows with `type: 'system'` and `criteria_key` set. After seeding events + check-ins + users, run `checkAndAwardSystemBadges` for each seeded user to retroactively award earned badges.

Add to `scripts/unseed.ts`: delete `user_badges` for system badges, then delete system badge rows (`WHERE type = 'system'`).

**Commit:** `feat: seed system badges and retroactive awards`

---

### Task 11: Profile Page — Badge Query Update

**Files:**

- Modify: `src/app/(frontend)/(participant)/profile/[username]/page.tsx:192-224`

Update the badge fetch query to include `type` field so BadgeGrid can distinguish system vs event badges. The `events(title)` join should use a left join (already nullable) — just ensure system badges with null event render correctly.

**Commit:** `feat: support system badges in profile badge display`

---

## Task Order & Dependencies

```
Task 1 (DB migration) → Task 2 (constants) → Task 3 (evaluation logic) → Task 5 (check-in integration)
                                             → Task 4 (email template) ↗
Task 6, 7, 8 (UI updates) — can run in parallel after Task 1
Task 9 (achievements page) — after Task 1
Task 10 (seed) — after Tasks 1-5
Task 11 (profile query) — after Task 1
```
