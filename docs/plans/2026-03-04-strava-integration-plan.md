# Strava Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full Strava integration — OAuth login, account linking, activity verification (manual + auto-match), profile enrichment (stats + feed), route sharing (Strava URL + GPX), and post-event sync.

**Architecture:** Custom OAuth flow with Strava API. Tokens stored in `strava_connections` table. Webhook receives activity events for auto-matching. All Strava API calls go through server-side helper with automatic token refresh. Leaflet (already installed) for route/activity map rendering.

**Tech Stack:** Next.js App Router, Supabase, Strava API v3, Leaflet/react-leaflet, polyline decoding

---

### Task 1: Database Schema & Types

**Files:**

- Modify: `src/lib/supabase/types.ts` — add types for `strava_connections`, `strava_activities`, `event_routes`, `strava_webhook_subscriptions`

**Steps:**

1. Create the 4 tables in Supabase dashboard (see design doc for schema)
2. Set up RLS policies: `strava_connections` read/write own rows only; `strava_activities` read own + read by booking participants; `event_routes` public read, organizer write; `strava_webhook_subscriptions` service role only
3. Add Row/Insert/Update types to `types.ts` following existing patterns (strict unions for `source: 'strava' | 'gpx'`)
4. Add tables to the `Database` interface
5. Run `pnpm typecheck`
6. Commit

---

### Task 2: Environment Variables & Strava Client Helper

**Files:**

- Modify: `.env.local.example` — add `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_STRAVA_CLIENT_ID`, `STRAVA_WEBHOOK_VERIFY_TOKEN`
- Create: `src/lib/strava/client.ts` — Strava API helper with token refresh
- Create: `src/lib/strava/types.ts` — Strava API response types (athlete, activity, route)
- Create: `src/lib/strava/constants.ts` — scopes, URLs, activity type mapping

**Steps:**

1. Add env vars to `.env.local.example` with comments
2. Create `src/lib/strava/constants.ts` — `STRAVA_AUTH_URL`, `STRAVA_TOKEN_URL`, `STRAVA_API_BASE`, scopes array, activity type map (`Run→running`, `Ride→mtb/road_bike`, `Hike→hiking`, `TrailRun→trail_running`)
3. Create `src/lib/strava/types.ts` — types for `StravaAthlete`, `StravaActivity`, `StravaRoute`, `StravaTokenResponse`
4. Create `src/lib/strava/client.ts` — `getStravaClient(userId)` that fetches tokens from `strava_connections`, refreshes if expired, returns an object with methods: `getAthlete()`, `getActivities(params)`, `getRoute(routeId)`, `getAthleteStats(athleteId)`, `createActivity(data)`. Uses `fetch()` internally.
5. Run `pnpm typecheck`
6. Commit

---

### Task 3: Strava OAuth — Login & Signup

**Files:**

- Modify: `src/app/(frontend)/(auth)/login/page.tsx` — add "Continue with Strava" button
- Modify: `src/app/(frontend)/(auth)/signup/page.tsx` — add "Continue with Strava" button
- Create: `src/app/(frontend)/auth/strava/callback/route.ts` — OAuth callback handler
- Create: `src/components/icons/StravaIcon.tsx` — Strava logo SVG icon
- Modify: `src/components/icons/index.ts` — export StravaIcon

**Steps:**

1. Create `StravaIcon` component in icons folder, add to barrel export
2. Add "Continue with Strava" button to login page (orange, Strava brand color `#FC4C02`) — onClick redirects to Strava auth URL with `response_type=code`, `client_id`, `redirect_uri=/auth/strava/callback`, `scope=read,activity:read_all,activity:write`
3. Add same button to signup page
4. Create callback route handler:
   - Exchange code for tokens via `POST https://www.strava.com/oauth/token`
   - Check if `strava_athlete_id` exists in `strava_connections`
   - **New user:** Create Supabase user via service role admin API (`auth.admin.createUser` with email from Strava profile or generated), insert `strava_connections` row, insert `users` row, redirect to `/events`
   - **Existing user:** Sign in via `auth.admin.generateLink` or update tokens, redirect based on role
   - **Already logged in:** Link Strava to existing account (Flow B from design)
5. Run `pnpm typecheck`
6. Test manually: login with Strava flow
7. Commit

---

### Task 4: Connect/Disconnect Strava (Existing Users)

**Files:**

- Create: `src/app/api/strava/status/route.ts` — GET connection status
- Create: `src/app/api/strava/disconnect/route.ts` — DELETE connection
- Create: `src/components/strava/StravaConnectButton.tsx` — branded connect button
- Create: `src/components/strava/StravaConnectionCard.tsx` — settings card showing connection status + disconnect

**Steps:**

1. Create `GET /api/strava/status` — returns `{ connected: boolean, athlete?: { name, avatar, id } }` for authenticated user
2. Create `DELETE /api/strava/disconnect` — deletes `strava_connections` row for authenticated user
3. Create `StravaConnectButton` — orange branded button, redirects to Strava OAuth URL with `state` param containing return URL
4. Create `StravaConnectionCard` — shows connected athlete info or connect button, disconnect option
5. Add `StravaConnectionCard` to organizer settings page and profile settings (if exists)
6. Run `pnpm typecheck`
7. Test manually: connect and disconnect flow
8. Commit

---

### Task 5: Activity Fetching & Manual Linking

**Files:**

- Create: `src/app/api/strava/activities/route.ts` — GET recent activities
- Create: `src/app/api/strava/activities/link/route.ts` — POST link activity to booking
- Create: `src/app/api/strava/activities/[id]/unlink/route.ts` — DELETE unlink
- Create: `src/components/strava/StravaActivityCard.tsx` — activity display component
- Create: `src/components/strava/LinkActivityModal.tsx` — modal to select and link an activity

**Steps:**

1. Create `GET /api/strava/activities` — calls Strava API `getActivities({ per_page: 20, after: timestamp })`, returns formatted activities
2. Create `POST /api/strava/activities/link` — accepts `{ strava_activity_id, booking_id }`, fetches activity details from Strava, inserts `strava_activities` row with `matched_automatically: false`
3. Create `DELETE /api/strava/activities/[id]/unlink` — deletes `strava_activities` row, verify ownership
4. Create `StravaActivityCard` — shows activity name, type icon, distance (km), moving time, elevation, mini polyline map thumbnail
5. Create `LinkActivityModal` — fetches recent activities, shows list of `StravaActivityCard`s, click to link to a specific booking. Uses dynamic import (modal behind user interaction).
6. Run `pnpm typecheck`
7. Commit

---

### Task 6: Strava Webhook & Auto-Matching

**Files:**

- Create: `src/app/api/webhooks/strava/route.ts` — GET (validation) + POST (events)
- Create: `src/lib/strava/webhook.ts` — auto-match logic

**Steps:**

1. Create `GET /api/webhooks/strava` — responds to Strava's subscription validation with `hub.challenge`
2. Create `POST /api/webhooks/strava` — receives activity events, validates with verify token
3. Create auto-match logic in `src/lib/strava/webhook.ts`:
   - On `activity.create` event: look up user by `strava_athlete_id`
   - Find confirmed bookings where event date is within 24h of activity start
   - Match activity type to event type using mapping from constants
   - If match → fetch full activity from Strava API → insert `strava_activities` with `matched_automatically: true`
4. Use Supabase service role client for webhook (no user session)
5. Run `pnpm typecheck`
6. Commit

**Note:** Strava webhook subscription must be created via their API (one-time setup per app). Can be done via a script or curl command — document in README.

---

### Task 7: Profile Enrichment — Stats & Activity Feed

**Files:**

- Create: `src/components/strava/StravaStatsBar.tsx` — summary stats with "Powered by Strava"
- Create: `src/components/strava/StravaActivityFeed.tsx` — recent activities list
- Modify: `src/app/(frontend)/(participant)/profile/[username]/page.tsx` — add Strava sections

**Steps:**

1. Create `StravaStatsBar` — displays total distance, total activities, recent activity count. Uses cached `athlete_data` from `strava_connections` table. Shows "Powered by Strava" per brand guidelines.
2. Create `StravaActivityFeed` — client component, fetches from `/api/strava/activities`, renders list of `StravaActivityCard`s. Only shown if user has Strava connected.
3. Modify profile page:
   - Fetch `strava_connections` for the profile user (only `athlete_data`, not tokens)
   - If connected: show `StravaStatsBar` after existing stats section
   - If connected + viewing own profile: show `StravaActivityFeed`
   - If own profile + not connected: show `StravaConnectButton`
4. Run `pnpm typecheck`
5. Test manually: view profile with/without Strava connected
6. Commit

---

### Task 8: My Events — Activity Linking UI

**Files:**

- Modify: `src/app/(frontend)/(participant)/my-events/page.tsx` — add Strava linking to past events

**Steps:**

1. Fetch `strava_activities` for user's bookings (join on `booking_id`)
2. For past events with check-in but no linked activity: show "Link Strava Activity" button → opens `LinkActivityModal`
3. For events with linked activity: show `StravaActivityCard` inline with "Auto-verified via Strava" badge if `matched_automatically` or "Verified via Strava" if manual. Show unlink option.
4. Run `pnpm typecheck`
5. Test manually
6. Commit

---

### Task 9: Route Sharing — Strava URL & GPX Upload

**Files:**

- Create: `src/app/api/events/[id]/route-data/route.ts` — GET/POST/DELETE event route (use `route-data` to avoid collision with Next.js `route.ts`)
- Create: `src/components/strava/RouteMap.tsx` — Leaflet polyline map component
- Create: `src/components/strava/RouteAttachmentForm.tsx` — form for organizers to attach routes
- Create: `src/lib/strava/gpx.ts` — GPX parser utility

**Steps:**

1. Create GPX parser — parse GPX XML to extract coordinates, distance, elevation. Use built-in DOMParser or a lightweight lib.
2. Create `POST /api/events/[id]/route-data`:
   - Accepts `{ source: 'strava', strava_route_url }` — extracts route ID from URL, fetches via Strava API, stores polyline/distance/elevation
   - Accepts `{ source: 'gpx', gpx_file }` (multipart) — parses GPX, uploads raw file to R2, stores extracted data
   - Validates user is the event organizer
3. Create `GET /api/events/[id]/route-data` — returns route data (public)
4. Create `DELETE /api/events/[id]/route-data` — removes route (organizer only)
5. Create `RouteMap` — Leaflet component that decodes polyline and renders on map. Dynamic import with `ssr: false` (Leaflet is browser-only). Show distance + elevation stats overlay.
6. Create `RouteAttachmentForm` — tab/toggle between "Strava URL" and "GPX Upload", submit calls the API
7. Run `pnpm typecheck`
8. Commit

---

### Task 10: Event Detail — Route Display

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx` — add route section

**Steps:**

1. Fetch `event_routes` for the event
2. If route exists: render new "Route" section with `RouteMap` component + distance/elevation stats
3. Dynamic import `RouteMap` (Leaflet, browser-only)
4. Run `pnpm typecheck`
5. Test manually: view event with/without route
6. Commit

---

### Task 11: Event Create/Edit — Route Attachment

**Files:**

- Modify: event create/edit form component — add `RouteAttachmentForm` section

**Steps:**

1. Add "Event Route" section to event form (both create and edit modes)
2. If editing and route exists: show current route with `RouteMap` preview + delete option
3. If no route: show `RouteAttachmentForm`
4. Run `pnpm typecheck`
5. Test manually: create event with route, edit to change route
6. Commit

---

### Task 12: Install Dependencies & Final Checks

**Files:**

- Modify: `package.json` — add `@mapbox/polyline` (decode Strava polylines) if not using a lighter alternative

**Steps:**

1. Install polyline decoding: `pnpm add @mapbox/polyline` + `pnpm add -D @types/mapbox__polyline`
2. Run full CI pipeline: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build`
3. Fix any issues
4. Update `.env.local.example` with Strava vars (if not already done)
5. Update `CLAUDE.md` — add Strava section to Architecture docs
6. Commit

---

## Dependency Graph

```
Task 1 (Schema) → Task 2 (Client) → Task 3 (OAuth Login)
                                   → Task 4 (Connect/Disconnect)
                                   → Task 5 (Activities) → Task 6 (Webhook)
                                                         → Task 7 (Profile)
                                                         → Task 8 (My Events)
                                   → Task 9 (Routes) → Task 10 (Event Detail)
                                                     → Task 11 (Event Form)
Task 12 (Final) depends on all above
```

Tasks 3-11 can be parallelized after Tasks 1-2 are complete, respecting the graph above.
