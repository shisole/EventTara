# Strava Showcase Section — Homepage

## Overview

Add a "Powered by Strava" showcase section to the homepage, placed directly after the Hero. Three sub-sections controlled by individual feature flags in `cms_feature_flags`.

## Feature Flags

| Flag                        | Sub-section                 | Default |
| --------------------------- | --------------------------- | ------- |
| `strava_showcase_features`  | Feature highlights grid     | ON      |
| `strava_showcase_stats`     | Live aggregate stats        | ON      |
| `strava_showcase_route_map` | Visual route demo (Leaflet) | ON      |

If all flags are off, the entire section is hidden.

## Sub-sections

### 1. Feature Highlights (`strava_showcase_features`)

3-column grid with icons:

- **Route Maps** — Every event shows an interactive trail map
- **Auto-Verify** — Link Strava activities to confirm participation
- **Track Stats** — Distance, elevation, and activity history on your profile

### 2. Live Aggregate Stats (`strava_showcase_stats`)

3 big numbers fetched server-side:

- Total km tracked (from `strava_activities.distance`)
- Activities linked (count of `strava_activities`)
- Routes mapped (count of `event_routes`)

### 3. Visual Route Demo (`strava_showcase_route_map`)

Full-width Leaflet `RouteMap` showing the Iloilo–Miag-ao Coastal Road polyline (hardcoded). Distance + elevation stats overlay (built into RouteMap).

## Layout

- Section header: Strava icon + "Powered by Strava" badge + headline + description
- Sub-sections stack vertically below header
- Responsive: columns collapse on mobile

## Components

- `src/components/landing/StravaShowcaseSection.tsx` — async server component (reads flags, fetches stats)
- `src/components/landing/StravaShowcaseRouteMap.tsx` — client component (dynamic import RouteMap, ssr: false)

## Files to modify

- `src/app/(frontend)/page.tsx` — add section after Hero
- `src/lib/cms/cached.ts` — add cached query for new flags (or reuse existing)
- `src/lib/cms/types.ts` — add flag names to type if needed
- SQL: insert 3 new rows into `cms_feature_flags`
