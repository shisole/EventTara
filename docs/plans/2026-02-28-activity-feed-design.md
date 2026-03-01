# Activity Feed & Follow System Design

## Problem

EventTara has a solid gamification layer (badges, avatar borders, check-ins, reviews) but no social connectivity. Users can't see what others are doing, follow people, or interact with achievements. A Strava-style activity feed with emoji reactions would increase engagement and community.

## Feed Page (`/feed`)

Single unified feed showing all public activity, ordered by most recent. Each card shows:

- **User avatar** (with active border) + **name** + **top badge** + **"Following" indicator** if viewer follows them
- **Activity text**: "joined Mt. Napulak Dayhike", "completed Mt. Pulag Traverse", "earned Summit Seeker", "unlocked Epic border"
- **Context image**: event cover, badge image, or border preview
- **Relative timestamp**: "2h ago", "3d ago"
- **Reaction bar**: fire, clap, green heart, mountain — with counts per emoji. Tap to toggle.

Public to all visitors. Reactions and follow require login. Infinite scroll pagination.

## Follow System

- `user_follows` table: `follower_id`, `following_id`, `created_at`
- Follow/unfollow button on `/profile/[username]` pages
- Feed cards show a subtle "Following" indicator for people you follow
- No follower/following counts displayed — keep it minimal

## Data Model

No activity log table. Feed built from a union query across 4 source tables:

| Source Table          | Timestamp Field | Activity Text                   |
| --------------------- | --------------- | ------------------------------- |
| `bookings`            | `created_at`    | "is joining [Event Title]"      |
| `event_checkins`      | `checked_in_at` | "completed [Event Title]"       |
| `user_badges`         | `awarded_at`    | "earned [Badge Title]"          |
| `user_avatar_borders` | `awarded_at`    | "unlocked [Border Tier] border" |

## Reactions Table (`feed_reactions`)

- `id`, `user_id`, `activity_type` (booking/checkin/badge/border), `activity_id`, `emoji` (fire/clap/green_heart/mountain), `created_at`
- Unique constraint: one reaction per emoji per user per activity
- Preset emojis only — no custom input

## Privacy

- Guest/anonymous bookings excluded from feed (`users.is_guest = false`)
- Cancelled bookings excluded
- All activity is public (no opt-out for v1)

## Navigation

- New `/feed` page added to bottom nav (mobile) and navbar (desktop)

## Out of Scope

- Comments on activities
- Notification system (follow notifications, reaction notifications)
- Activity opt-out / privacy settings
- Direct messaging
- Follower/following counts on profiles
