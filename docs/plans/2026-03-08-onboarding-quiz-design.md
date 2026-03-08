# Onboarding Quiz Design

## Overview

A first-visit onboarding quiz modal that collects user preferences and demographics before authentication. Shows once on first site visit, controlled by a CMS feature flag.

## Quiz Flow (4 Steps)

### Step 1 — Activities & Experience

- Grid of 5 image cards (multi-select): Hiking, Mountain Biking, Road Cycling, Running, Trail Running
- Each card is a photo with the activity name overlaid, using existing event type color palette (emerald for hiking, amber for MTB, blue for road cycling, orange for running, yellow-brown for trail running)
- "All of the above" option below the grid
- After selecting activities, a follow-up appears: experience level selector (Beginner / Intermediate / Advanced) — single select, applies globally

### Step 2 — About You

- First name (text input)
- Age range (pill buttons): 18-24, 25-34, 35-44, 45-54, 55+
- Location (searchable dropdown of Philippine provinces/cities, focused on Panay Island regions)

### Step 3 — How did you find us?

- Single-select icon cards: Social Media, Friend/Word of Mouth, Google Search, Event Poster, Other

### Step 4 — Get Started

- Two CTA options: "Create Account" (primary) and "Continue as Guest" (secondary)
- Brief value props for creating an account (save events, earn badges, track activities)
- Selecting either closes the modal and routes appropriately

## Trigger & Behavior

- Shows on **first site visit** (no auth required)
- Tracked via `localStorage` key `quiz_completed`
- Full-screen modal at `z-[85]` (above EntryBanner at 70, below ChatPanel at 999)
- **Skip button** visible on every step (top-right)
- Progress bar at top showing current step
- Smooth slide transitions between steps
- Controlled by `onboarding_quiz` feature flag in CMS

## Data Storage

- **localStorage**: Store responses immediately for client-side personalization + `anonymous_id` UUID
- **Database**: New `quiz_responses` table with anonymous ID (UUID stored in localStorage). If user later creates an account, link via `user_id` column
- **API**: `POST /api/quiz` to save responses. On signup/login, link existing quiz response to the new user account via anonymous_id match

## Database Schema

```sql
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
```

## Visual Design

- Dark overlay backdrop with centered modal card
- Rounded corners, white background, clean typography
- Activity cards use existing event type color palette
- Animated progress bar with step count (e.g., "Step 1 of 4")
- Mobile-first: full-screen on mobile, centered card (max-w-lg) on desktop
- Entrance animation: fade + scale-up (consistent with existing modals like BetaNoticeModal)

## Feature Flag

Add `onboarding_quiz: boolean` to `cms_feature_flags` table. Default `false` for controlled rollout.

## Account Linking

When a user creates an account or signs in after completing the quiz:

1. Read `anonymous_id` from localStorage
2. Call `PATCH /api/quiz` with the anonymous_id to set `user_id` on the matching record
3. Pre-fill signup form name field from quiz `first_name` if available
