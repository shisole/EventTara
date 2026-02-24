# Guides Feature Design

## Problem
Hiking participants bond with guides more than organizers during events. They want to find and join future hikes based on which guide is leading. Guides (often local community members without tech access) need visibility and reputation on the platform without managing their own accounts.

## Approach
Organizer-managed guide profiles with public pages. Organizers create and tag guides on hiking events. Participants review guides after completed events. Data model supports optional future self-management via nullable `user_id`.

## Data Model

### `guides` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| full_name | text NOT NULL | |
| bio | text | Optional |
| avatar_url | text | Photo managed by organizer |
| contact_number | text | Optional, added if guide consents |
| user_id | uuid FK nullable | For future self-management (claim profile) |
| created_by | uuid FK NOT NULL | Organizer user who created this guide |
| created_at | timestamptz | |

### `event_guides` table (join)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK | References events |
| guide_id | uuid FK | References guides |
| created_at | timestamptz | |
| UNIQUE(event_id, guide_id) | | |

### `guide_reviews` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| guide_id | uuid FK | |
| user_id | uuid FK | Reviewer |
| event_id | uuid FK | Which event they hiked together |
| rating | int (1-5) | |
| text | text | Optional |
| created_at | timestamptz | |
| UNIQUE(guide_id, user_id, event_id) | | One review per guide per event per user |

## Pages & Routes

- `/guides/[id]` — Public guide profile: name, photo, bio, contact, avg rating, reviews, upcoming + past events
- `/events/[id]` — Add "Guides" section (avatar + name + rating, links to guide page). Only for hiking events.
- Dashboard event create/edit — Search/add guides from roster or create new
- Dashboard guide management — CRUD for organizer's guide roster

## Key Rules
- Any organizer can create a guide profile
- Any organizer can tag an existing guide on their hiking event
- Participants review guides only for events they attended (confirmed booking + completed event)
- Guide page aggregates events across all organizers
- `created_by` tracks original creator for management
- Hiking events only (not MTB, road bike, running, trail run)

## Deferred (future)
- Guide self-management / login / claiming profiles
- Guide accepting/declining event assignments
- Specialties, languages
- Guide following / notifications
