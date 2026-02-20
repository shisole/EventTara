# Testimonials & Event Reviews Design

**Date**: 2026-02-21
**Status**: Approved

## Problem

EventTara has no way for participants to leave feedback about events or organizers, and no way to showcase platform endorsements on the landing page.

## Approach

Two separate systems with different lifecycles:

1. **App testimonials** — admin-curated, displayed on landing page
2. **Event reviews** — user-submitted by checked-in participants, with star ratings

## Database Schema

### `app_testimonials` (curated, landing page)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Person's name |
| role | text | Label (e.g., "Trail Runner") |
| text | text | Testimonial body |
| avatar_url | text \| null | Optional photo |
| display_order | int | Controls sort order |
| is_active | boolean | Toggle visibility |
| created_at | timestamptz | Auto |

### `event_reviews` (user-submitted)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | FK to events |
| user_id | uuid | FK to users |
| rating | smallint | 1-5 stars |
| text | text \| null | Optional written review |
| created_at | timestamptz | Auto |

Constraint: unique on (event_id, user_id) — one review per person per event.

## App Testimonials (Landing Page)

- Displayed in a section on the landing page (alongside or replacing "Trusted by Organizers")
- Cards showing avatar, name, role, testimonial text
- Server Component fetches `app_testimonials` where `is_active = true`, ordered by `display_order`
- Managed via Supabase dashboard (no admin UI yet — deferred to Payload CMS phase)

## Event Reviews

### Submission Flow

**Primary path (events with badges):**
1. Organizer awards badge → email sent via Resend
2. Badge award email includes "Leave a Review" CTA → links to `/badges/[id]`
3. Badge page (`/badges/[id]`) shows badge details + inline review form below
4. Form: 1-5 star picker + optional text + submit button
5. Only shown if user has a check-in for this event and hasn't already reviewed

**Fallback path (all completed events):**
1. Event detail page (`/events/[id]`) shows review form below description
2. Only visible when: event status is `completed`, user has check-in record, user hasn't reviewed yet
3. Same form: star picker + optional text + submit

### API

`POST /api/events/[id]/reviews`
- Validates user is authenticated
- Validates user has a check-in record for this event
- Validates no existing review (unique constraint)
- Inserts into `event_reviews`
- Returns the created review

### Display

**Event detail page** (read-only section):
- Average rating + review count header
- List of review cards: avatar, name, star rating, text, date

**Organizer profile page:**
- Aggregate average rating across all organizer's events
- Total review count
- Recent reviews across their events

**Event cards** (homepage, event list, organizer profile):
- Small average rating badge (e.g., "4.8" with star icon) when event has reviews

### Badge Award Email Update

Add "Leave a Review" CTA button to the existing badge award email template, linking to `/badges/[id]`.

## Seed Data

- 3-4 app testimonials for the landing page
- Event reviews on completed/past seeded events from users with check-in records

## Out of Scope

- Admin UI for managing app testimonials (deferred to Payload CMS)
- Review moderation/approval (reviews go live immediately)
- Review editing/deletion by users
- Review responses by organizers
