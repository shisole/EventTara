# OG Image CPU Optimization

## Problem

OG images are the #1 CPU consumer on Vercel. All 3 opengraph-image routes regenerate on every request with no caching, and fonts are fetched over network from Google Fonts API on every cold start. This is burning through the 4h Fluid Active CPU free tier limit.

## Changes

### 1. Add `revalidate` exports

Cache generated images on Vercel's CDN so subsequent requests serve cached PNGs instead of re-rendering.

| File                                     | `revalidate`       | Rationale                                            |
| ---------------------------------------- | ------------------ | ---------------------------------------------------- |
| `(frontend)/opengraph-image.tsx`         | `false` (infinite) | Fully static branding, never changes between deploys |
| `events/[id]/opengraph-image.tsx`        | `3600` (1 hour)    | Event data changes infrequently                      |
| `profile/[username]/opengraph-image.tsx` | `3600` (1 hour)    | Badge count changes infrequently                     |

### 2. Bundle fonts locally

- Download `Dancing Script Bold` and `Inter Regular` .woff files into `src/lib/og/fonts/`
- Read from disk instead of fetching Google Fonts API
- Eliminates 2 network round-trips per cold start
- Remove in-memory caching (disk reads are fast enough)

### 3. Files changed

- `src/lib/og/brand-assets.ts` — replace `fetchGoogleFont()` with local file reads
- `src/app/(frontend)/opengraph-image.tsx` — add `revalidate = false`
- `src/app/(frontend)/(participant)/events/[id]/opengraph-image.tsx` — add `revalidate = 3600`
- `src/app/(frontend)/(participant)/profile/[username]/opengraph-image.tsx` — add `revalidate = 3600`
- New: `src/lib/og/fonts/DancingScript-Bold.woff`, `src/lib/og/fonts/Inter-Regular.woff`

## Expected Impact

- ~90%+ reduction in OG-related CPU (CDN serves cached images)
- Faster cold starts (no Google Fonts network calls)
- No visual changes to OG images
