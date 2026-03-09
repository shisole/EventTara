# Club Architecture Design

## Overview

Replace the current participant/organizer user model with a club-based community architecture. Users create and join clubs. Clubs own events. Club membership determines permissions via three-tier RBAC (Owner, Admin, Moderator, Member).

## Why Clubs

EventTara is an outdoor adventure platform. Outdoor events are organized by groups — hiking clubs, cycling crews, running teams — not individual "organizers." The club model reflects this reality and unlocks community features: members follow clubs, clubs have leaderboards, team-based event management.

## Database Schema

### Core Tables

**`clubs`** (replaces `organizer_profiles`)

| Column         | Type                 | Notes                                                |
| -------------- | -------------------- | ---------------------------------------------------- |
| id             | UUID PK              |                                                      |
| name           | TEXT NOT NULL        | Club display name                                    |
| slug           | TEXT UNIQUE NOT NULL | URL-friendly identifier                              |
| description    | TEXT                 |                                                      |
| logo_url       | TEXT                 |                                                      |
| cover_url      | TEXT                 | Cover/banner image                                   |
| activity_types | TEXT[]               | `{'hiking','mtb','road_bike','running','trail_run'}` |
| visibility     | TEXT                 | `'public'` or `'private'` (default `'public'`)       |
| payment_info   | JSONB                | Migrated from organizer_profiles                     |
| location       | TEXT                 | Region/province                                      |
| is_demo        | BOOLEAN              | For seed data                                        |
| created_at     | TIMESTAMPTZ          |                                                      |

**`club_members`** (RBAC junction table)

| Column                   | Type            | Notes                                           |
| ------------------------ | --------------- | ----------------------------------------------- |
| id                       | UUID PK         |                                                 |
| club_id                  | UUID FK → clubs |                                                 |
| user_id                  | UUID FK → users |                                                 |
| role                     | TEXT            | `'owner'`, `'admin'`, `'moderator'`, `'member'` |
| joined_at                | TIMESTAMPTZ     |                                                 |
| UNIQUE(club_id, user_id) |                 | One membership per club per user                |

**`club_invites`** (for private clubs)

| Column      | Type            | Notes            |
| ----------- | --------------- | ---------------- |
| id          | UUID PK         |                  |
| club_id     | UUID FK → clubs |                  |
| invited_by  | UUID FK → users |                  |
| invite_code | TEXT UNIQUE     | Shareable code   |
| max_uses    | INT             | NULL = unlimited |
| uses        | INT DEFAULT 0   |                  |
| expires_at  | TIMESTAMPTZ     |                  |
| created_at  | TIMESTAMPTZ     |                  |

### Modified Tables

- **`events`**: `organizer_id` → `club_id` (FK to clubs)
- **`users`**: Remove organizer/participant role distinction. Users are `'user'` or `'guest'`. Permissions come from `club_members`.

### Permission Matrix

| Action                   | Owner | Admin | Moderator | Member |
| ------------------------ | ----- | ----- | --------- | ------ |
| Create events            | Y     | Y     | -         | -      |
| Edit/delete events       | Y     | Y     | Y         | -      |
| Manage bookings/checkins | Y     | Y     | Y         | -      |
| Invite members           | Y     | Y     | -         | -      |
| Remove members           | Y     | Y     | -         | -      |
| Edit club settings       | Y     | Y     | -         | -      |
| Manage payment info      | Y     | -     | -         | -      |
| Delete club              | Y     | -     | -         | -      |
| Promote/demote roles     | Y     | -     | -         | -      |
| View club events         | Y     | Y     | Y         | Y      |

## Routes

### New Routes

- `/clubs` — Browse/discover clubs
- `/clubs/[slug]` — Club public profile
- `/clubs/new` — Create club form
- `/clubs/join/[code]` — Invite link landing
- `/dashboard` — Personal overview (all managed clubs)
- `/dashboard/clubs/[slug]` — Club dashboard
- `/dashboard/clubs/[slug]/events` — Club events list
- `/dashboard/clubs/[slug]/events/new` — Create event
- `/dashboard/clubs/[slug]/events/[id]` — Event details
- `/dashboard/clubs/[slug]/events/[id]/edit` — Edit event
- `/dashboard/clubs/[slug]/events/[id]/checkin` — Check-in scanner
- `/dashboard/clubs/[slug]/members` — Member management
- `/dashboard/clubs/[slug]/settings` — Club settings
- `/dashboard/clubs/[slug]/invites` — Invite management

### Navigation Changes

- Dashboard link: visible if user is owner/admin/moderator of any club
- "Host Your Event" → "Create a Club" or "Create Event" (if already in a club)
- Login redirect: everyone goes to `/events` (no role-based redirect)

## API Routes

### New Endpoints

- `GET/POST /api/clubs` — List/create clubs
- `GET/PATCH/DELETE /api/clubs/[slug]` — Club CRUD
- `GET/POST /api/clubs/[slug]/members` — List/join members
- `PATCH/DELETE /api/clubs/[slug]/members/[userId]` — Change role/remove
- `GET/POST/DELETE /api/clubs/[slug]/invites` — Invite management
- `GET /api/invites/[code]` — Validate invite code

### Modified Endpoints

- `POST /api/events` — Requires `club_id`, validates owner/admin role
- `PATCH/DELETE /api/events/[id]` — Validates owner/admin/moderator of event's club
- `GET /api/events` — Optional `club_id` filter

### Permission Helper

Shared `checkClubPermission(userId, clubId, requiredRoles)` utility used across all club-scoped API routes.

## Migration Strategy

### Data Migration

1. Each `organizer_profiles` row → `clubs` row (name from `org_name`, generate slug, carry over description/logo/payment_info/is_demo)
2. Each organizer's `user_id` → `club_members` row with `role = 'owner'`
3. `events.organizer_id` → `events.club_id`
4. `organizer_reviews` → `club_reviews`
5. All `role = 'organizer'` and `role = 'participant'` users → `role = 'user'`

### What Gets Removed

- `organizer_profiles` table
- `organizer_waitlist` table
- `users.role` organizer/participant distinction
- `/signup?role=organizer` flow
- Auto-create organizer profile on event creation
- Claim token system

## UI Components

### New

- `ClubCard`, `ClubGrid` — Browse page
- `ClubProfileHeader`, `ClubEventsList`, `ClubMembersList` — Club public page
- `CreateClubForm` — Club creation
- `ClubSwitcher`, `ClubDashboardLayout` — Dashboard
- `MemberManagement`, `InviteManager`, `ClubSettingsForm` — Club management
- `JoinClubButton`, `ClubRoleBadge`, `ClubSelector` — Shared

### Modified

- `EventCard` / `EventDetailHeader` — Show club name + logo
- `Navbar`, `MobileNav`, `MobileDrawer` — Club-aware navigation
- `ProfileHeader` — Show user's clubs

### Removed

- `OrganizerProfileForm`
- Organizer public page content
- Organizer signup flow components
