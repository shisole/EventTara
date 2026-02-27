# Auto System Badges Design

## Overview

Automatic platform-level badges awarded based on participant activity across EventTara, triggered on check-in.

## Data Model

**Changes to `badges` table:**

- Add `type: 'event' | 'system'` (default `'event'`)
- Add `criteria_key: string | null` — unique key for system badges (e.g., `'first_hike'`), null for event badges
- `event_id` remains nullable — system badges have no event

**No changes to `user_badges`** — same `user_id → badge_id` join.

## Badge Catalog (11 badges)

| Badge           | criteria_key      | Category  | Rarity    | Condition                                                     |
| --------------- | ----------------- | --------- | --------- | ------------------------------------------------------------- |
| First Hike      | `first_hike`      | adventure | common    | 1+ check-in, event type = hiking                              |
| First Run       | `first_run`       | distance  | common    | 1+ check-in, event type = running                             |
| First Road Ride | `first_road_ride` | distance  | common    | 1+ check-in, event type = road_bike                           |
| First MTB Ride  | `first_mtb`       | distance  | common    | 1+ check-in, event type = mtb                                 |
| First Trail Run | `first_trail_run` | adventure | common    | 1+ check-in, event type = trail_run                           |
| All-Rounder     | `all_rounder`     | special   | epic      | 1+ check-in in ALL 5 event types                              |
| 5 Events        | `events_5`        | special   | common    | 5+ total check-ins                                            |
| 10 Events       | `events_10`       | special   | rare      | 10+ total check-ins                                           |
| 25 Events       | `events_25`       | special   | epic      | 25+ total check-ins                                           |
| 50 Events       | `events_50`       | special   | legendary | 50+ total check-ins                                           |
| Pioneer         | `pioneer`         | special   | legendary | Among first 100 users to check in (by earliest checked_in_at) |

## Trigger: On Check-in

Non-blocking call in `POST /api/checkins` (same pattern as `checkAndAwardBorders`):

1. Fetch user's check-in stats in one query (total count, count per event type, earliest check-in)
2. Fetch user's existing system badges
3. Evaluate all 11 criteria against stats
4. Bulk upsert newly earned `user_badges` rows
5. Send ONE batched email listing all newly earned badges

## Email

- Single badge earned: existing template style — "You earned [badge]!"
- Multiple badges earned: batched email — "You earned N new badges!" with grid of all earned badges
- One CTA: "View Your Achievements" → `/achievements`

## UI Changes

- **`/achievements` page (NEW):** Grid of all 11 system badges. Earned = full color + date. Locked = grayscale + criteria hint. Progress counter: "X / 11 badges earned". Auth required.
- **`BadgeCard`:** Handle null `eventName` for system badges (show "System Achievement")
- **Badge detail page:** Skip "Event" section for system badges
- **Dashboard badge management:** Filter `WHERE type = 'event'` to hide system badges from organizers
- **Profile page:** System badges appear automatically (same query, same grid)

## Seed Script

- `npm run seed`: Insert 11 system badge rows + evaluate seeded users
- `npm run unseed`: Delete system badge user_badges + system badge rows

## Key Decisions

- Same `badges` table (not separate) — unified display, one query path
- Check-in trigger only (no cron) — all 11 badges evaluable at check-in time
- Non-blocking evaluation — check-in response returns immediately
- Idempotent — upsert prevents duplicates, safe to re-evaluate
- Retroactive via seed (pre-launch, no real users)
