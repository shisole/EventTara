# Onboarding Quiz Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a first-visit onboarding quiz modal that collects activity preferences, demographics, and discovery source from new visitors before authentication.

**Architecture:** 4-step stepper modal rendered in ClientShell, gated by `onboarding_quiz` feature flag. Quiz data is hardcoded in the component (not DB-driven) since the questions are static. Responses are stored in localStorage immediately and persisted to a `quiz_responses` table via `POST /api/quiz`. Anonymous visitors get a UUID stored in localStorage; on signup the record is linked to their account.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase, Tailwind CSS, localStorage

**Design doc:** `docs/plans/2026-03-08-onboarding-quiz-design.md`

---

### Task 1: Database — Create quiz_responses table

**Files:**

- Create: `supabase/migrations/011_quiz_responses.sql`

**Step 1: Write the migration**

```sql
-- Quiz responses for onboarding demographics
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id UUID NOT NULL,
  activities TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  first_name TEXT,
  age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  location TEXT,
  discovery_source TEXT CHECK (discovery_source IN ('social_media', 'friend', 'google', 'poster', 'other')),
  completed_at TIMESTAMPTZ,
  skipped_at_step INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quiz_responses_anonymous_id ON quiz_responses(anonymous_id);
CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);

-- RLS: anyone can insert (anonymous visitors), only owner can read their own
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz responses"
  ON quiz_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own quiz responses"
  ON quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz responses"
  ON quiz_responses FOR UPDATE
  USING (anonymous_id = anonymous_id)
  WITH CHECK (true);
```

**Step 2: Run migration in Supabase dashboard**

Execute the SQL above in Supabase SQL Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/011_quiz_responses.sql
git commit -m "feat(db): add quiz_responses table for onboarding demographics"
```

---

### Task 2: Types — Add quiz_responses to Supabase types and CMS feature flag

**Files:**

- Modify: `src/lib/supabase/types.ts`
- Modify: `src/lib/cms/types.ts`

**Step 1: Add quiz_responses table type**

Add to `Database["public"]["Tables"]` in `src/lib/supabase/types.ts`:

```typescript
quiz_responses: {
  Row: {
    id: string;
    user_id: string | null;
    anonymous_id: string;
    activities: string[];
    experience_level: "beginner" | "intermediate" | "advanced" | null;
    first_name: string | null;
    age_range: "18-24" | "25-34" | "35-44" | "45-54" | "55+" | null;
    location: string | null;
    discovery_source: "social_media" | "friend" | "google" | "poster" | "other" | null;
    completed_at: string | null;
    skipped_at_step: number | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id?: string | null;
    anonymous_id: string;
    activities?: string[];
    experience_level?: "beginner" | "intermediate" | "advanced" | null;
    first_name?: string | null;
    age_range?: "18-24" | "25-34" | "35-44" | "45-54" | "55+" | null;
    location?: string | null;
    discovery_source?: "social_media" | "friend" | "google" | "poster" | "other" | null;
    completed_at?: string | null;
    skipped_at_step?: number | null;
  };
  Update: Partial<Database["public"]["Tables"]["quiz_responses"]["Insert"]>;
};
```

**Step 2: Add onboarding_quiz feature flag**

Add to `CmsFeatureFlags` interface in `src/lib/cms/types.ts`:

```typescript
onboarding_quiz: boolean;
```

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts src/lib/cms/types.ts
git commit -m "feat: add quiz_responses types and onboarding_quiz feature flag"
```

---

### Task 3: API — Create POST /api/quiz endpoint

**Files:**

- Create: `src/app/api/quiz/route.ts`

**Step 1: Implement the API route**

Follow the pattern from `src/app/api/waitlist/route.ts`. The endpoint accepts quiz responses and upserts by anonymous_id.

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      anonymous_id,
      activities,
      experience_level,
      first_name,
      age_range,
      location,
      discovery_source,
      completed_at,
      skipped_at_step,
    } = body;

    if (!anonymous_id) {
      return NextResponse.json({ error: "anonymous_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user is authenticated to link account
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("quiz_responses").upsert(
      {
        anonymous_id,
        activities: activities ?? [],
        experience_level: experience_level ?? null,
        first_name: first_name ?? null,
        age_range: age_range ?? null,
        location: location ?? null,
        discovery_source: discovery_source ?? null,
        completed_at: completed_at ?? null,
        skipped_at_step: skipped_at_step ?? null,
        user_id: user?.id ?? null,
      },
      { onConflict: "anonymous_id" },
    );

    if (error) {
      console.error("[Quiz] Insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
```

Note: The upsert on `anonymous_id` requires a unique constraint. Add this to the migration:

```sql
ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_anonymous_id_unique UNIQUE (anonymous_id);
```

**Step 2: Commit**

```bash
git add src/app/api/quiz/route.ts
git commit -m "feat: add POST /api/quiz endpoint for onboarding responses"
```

---

### Task 4: Component — Build OnboardingQuizModal

**Files:**

- Create: `src/components/onboarding/OnboardingQuizModal.tsx`

This is the main component. It follows the BetaNoticeModal pattern (`src/components/landing/BetaNoticeModal.tsx`) for modal lifecycle (open/visible states, escape key, animations) and implements a 4-step stepper.

**Step 1: Create the component**

Key implementation notes:

- Uses `localStorage` key `quiz_completed` to track completion (persists across sessions, unlike sessionStorage)
- Uses `localStorage` key `quiz_anonymous_id` to store the anonymous UUID
- Generates anonymous_id via `crypto.randomUUID()`
- Z-index: `z-[85]` (between EntryBanner z-70 and SplashScreen z-100)
- Modal is full-screen on mobile (`max-w-lg` on desktop)
- Skip button on every step (top-right corner)
- Progress bar at top
- Body scroll lock via `document.body.style.overflow = "hidden"`
- Check `window.location.search` for `?lighthouse` to skip (performance testing)
- Feature flag gated: only renders if `featureFlags?.onboarding_quiz === true`

**Quiz steps and their UI:**

**Step 1 — Activities & Experience:**

- 5 image cards in a grid (2 cols mobile, 3 cols desktop): Hiking, Mountain Biking, Road Cycling, Running, Trail Running
- Each card: rounded-2xl, aspect-square-ish, gradient background matching event type colors (emerald/amber/blue/orange/yellow-brown), activity name overlay, checkmark when selected
- Multi-select (toggle on/off)
- "All of the above" pill below the grid
- Below cards: experience level as 3 pill buttons (Beginner / Intermediate / Advanced), single select
- "Next" button at bottom (enabled when at least 1 activity selected)

**Step 2 — About You:**

- First name: text input using `<Input>` component from `src/components/ui/Input.tsx`
- Age range: row of pill buttons (18-24, 25-34, 35-44, 45-54, 55+), single select
- Location: text input with placeholder "e.g., Iloilo City" (simple text, not a dropdown — keeps it lightweight)
- "Next" button (always enabled, all fields optional)

**Step 3 — How did you find us?:**

- 5 option cards (single select): Social Media, Friend/Word of Mouth, Google Search, Event Poster, Other
- Each with a simple icon and label
- "Next" button (enabled when one selected)

**Step 4 — Get Started:**

- Celebratory heading ("You're all set!")
- Brief value props for creating account (3 bullet points)
- "Create Account" primary button → navigates to `/signup`
- "Continue as Guest" secondary/ghost button → closes modal
- Both options close the modal and save responses

**Transitions between steps:** Use CSS translate-x animation (slide left on next, slide right on back). Similar to BentoEventsClient slide pattern.

**Data flow:**

- Each step updates local state (`useState` for each field)
- On "Next" in each step: save current state to localStorage as JSON
- On final step or skip: POST to `/api/quiz` with all collected data
- On skip: include `skipped_at_step` number

**Step 2: Commit**

```bash
git add src/components/onboarding/OnboardingQuizModal.tsx
git commit -m "feat: add OnboardingQuizModal component with 4-step stepper"
```

---

### Task 5: Integration — Mount modal in ClientShell

**Files:**

- Modify: `src/components/layout/ClientShell.tsx`

**Step 1: Import and render the modal**

In `src/components/layout/ClientShell.tsx`:

1. Add dynamic import at the top (since it's behind user interaction / feature flag):

```typescript
import dynamic from "next/dynamic";

const OnboardingQuizModal = dynamic(() => import("@/components/onboarding/OnboardingQuizModal"));
```

2. Render alongside other modals (near line 280, after the existing modal components):

```tsx
<OnboardingQuizModal featureFlags={featureFlags} />
```

The component already receives `featureFlags` as a prop. Pass it through.

**Step 2: Commit**

```bash
git add src/components/layout/ClientShell.tsx
git commit -m "feat: mount OnboardingQuizModal in ClientShell"
```

---

### Task 6: Feature flag — Enable in database

**Step 1: Add the flag in Supabase**

Run in Supabase SQL Editor:

```sql
UPDATE cms_feature_flags
SET onboarding_quiz = false
WHERE id = 1;
```

Or add the column first if it doesn't exist:

```sql
ALTER TABLE cms_feature_flags ADD COLUMN IF NOT EXISTS onboarding_quiz BOOLEAN DEFAULT false;
```

**Step 2: Test locally**

1. Set `onboarding_quiz = true` in Supabase dashboard
2. Clear localStorage (`localStorage.removeItem("quiz_completed")`)
3. Visit homepage — quiz modal should appear
4. Complete the quiz — verify responses saved in `quiz_responses` table
5. Refresh — quiz should NOT show again
6. Set flag to `false` — quiz should not appear even with localStorage cleared

---

### Task 7: Account linking — Link quiz response on signup

**Files:**

- Modify: `src/app/(frontend)/(auth)/signup/page.tsx` or the auth callback

**Step 1: After successful signup, link the quiz response**

After a user creates an account, read `quiz_anonymous_id` from localStorage and call the API to link:

```typescript
// After successful signup/login
const anonymousId = localStorage.getItem("quiz_anonymous_id");
if (anonymousId) {
  fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymous_id: anonymousId }),
  }).catch(() => {});
}
```

This upserts with the same anonymous_id but now includes the authenticated user_id.

**Step 2: Commit**

```bash
git add src/app/(frontend)/(auth)/signup/page.tsx
git commit -m "feat: link quiz response to user account on signup"
```

---

### Task 8: Testing & polish

**Step 1: Manual test checklist**

- [ ] Quiz appears on first visit (localStorage clean)
- [ ] Quiz does NOT appear on subsequent visits
- [ ] Skip button works on every step, saves `skipped_at_step`
- [ ] Activities multi-select works, "All of the above" selects all
- [ ] Experience level single-select works
- [ ] Step 2 fields are optional, can proceed without filling
- [ ] Step 3 single-select works
- [ ] Step 4 "Create Account" navigates to /signup
- [ ] Step 4 "Continue as Guest" closes modal
- [ ] Escape key closes modal
- [ ] Data saved to `quiz_responses` table in Supabase
- [ ] Feature flag toggle works (off = no quiz)
- [ ] Mobile responsive (full-screen modal)
- [ ] Dark mode works
- [ ] Lighthouse param `?lighthouse` skips quiz
- [ ] Back button works in stepper

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: onboarding quiz polish and testing"
```
