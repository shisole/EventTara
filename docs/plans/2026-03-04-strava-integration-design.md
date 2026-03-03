# Strava Integration Design

## Overview

Full Strava integration for EventTara: OAuth login, account linking, activity verification, profile enrichment, route sharing, and post-event sync.

## Auth

### Login with Strava (new users)

1. "Continue with Strava" button on `/login` and `/signup`
2. Redirects to `https://www.strava.com/oauth/authorize` with scopes: `read`, `activity:read_all`, `activity:write`
3. Callback at `/auth/strava/callback` exchanges code for tokens
4. No existing user with that `strava_athlete_id` -> create Supabase user via admin API, store tokens, redirect to profile setup
5. Existing user -> sign in, refresh tokens

### Connect Strava (existing users)

1. "Connect Strava" button on profile/settings
2. Same OAuth redirect, but callback knows user is authenticated
3. Stores tokens in `strava_connections` linked to existing user ID

### Token Management

- Tokens stored in `strava_connections` table
- Strava tokens expire every 6 hours; refreshed server-side via helper `getStravaClient(userId)`

## Database Schema

### `strava_connections`

- `id` uuid PK
- `user_id` uuid FK -> users (unique)
- `strava_athlete_id` bigint
- `access_token` text
- `refresh_token` text
- `expires_at` timestamptz
- `scope` text
- `athlete_data` jsonb (cached profile/stats)
- `created_at`, `updated_at` timestamptz

### `strava_activities`

- `id` uuid PK
- `user_id` uuid FK -> users
- `strava_activity_id` bigint
- `booking_id` uuid FK -> bookings (nullable)
- `name` text
- `type` text ("Run", "Ride", "Hike", etc.)
- `distance` numeric (meters)
- `moving_time` integer (seconds)
- `elapsed_time` integer (seconds)
- `total_elevation_gain` numeric (meters)
- `start_date` timestamptz
- `summary_polyline` text
- `matched_automatically` boolean
- `created_at` timestamptz

### `event_routes`

- `id` uuid PK
- `event_id` uuid FK -> events (unique)
- `strava_route_id` bigint (nullable)
- `gpx_url` text (nullable)
- `source` text ('strava' | 'gpx')
- `name` text
- `distance` numeric (meters)
- `elevation_gain` numeric (meters)
- `summary_polyline` text
- `created_at` timestamptz

### `strava_webhook_subscriptions`

- `id` uuid PK
- `subscription_id` integer
- `verify_token` text
- `created_at` timestamptz

## API Routes

### Auth

- `GET /auth/strava/callback` -- OAuth code exchange
- `POST /api/strava/refresh` -- token refresh helper

### Connection

- `GET /api/strava/status` -- check connection status
- `DELETE /api/strava/disconnect` -- remove connection

### Activities

- `GET /api/strava/activities` -- fetch recent activities
- `POST /api/strava/activities/link` -- link activity to booking
- `DELETE /api/strava/activities/[id]/unlink` -- unlink activity

### Routes

- `POST /api/events/[id]/route` -- attach route (Strava URL or GPX)
- `GET /api/events/[id]/route` -- get route data
- `DELETE /api/events/[id]/route` -- remove route

### Webhook

- `GET /api/webhooks/strava` -- validation (hub challenge)
- `POST /api/webhooks/strava` -- receive activity events, auto-match

### Auto-match logic

1. Find user via `strava_athlete_id`
2. Find confirmed bookings where event date is within 24h of activity start
3. Match activity type to event type (Run->running, Ride->mtb/road_bike, Hike->hiking)
4. If match -> create `strava_activities` row with `matched_automatically: true`
5. No match -> ignore (user can manually link)

## UI Components

### Pages modified

- `/login`, `/signup` -- "Continue with Strava" button
- `/profile/[username]` -- Strava stats section, recent activity feed, connect button
- `/my-events` -- "Link Strava Activity" button, linked activity badge, auto-match indicator
- `/events/[id]` -- route section with map
- Event create/edit (organizer) -- route attachment (Strava URL + GPX upload)
- Settings -- Strava connection card

### New shared components

- `StravaConnectButton` -- branded OAuth trigger
- `StravaActivityCard` -- single activity display (name, type, distance, time, mini map)
- `RouteMap` -- Leaflet polyline map (route preview + activity maps)
- `StravaStatsBar` -- summary stats with "Powered by Strava" branding
