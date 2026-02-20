# Badge Taxonomy & Enrichment Design

**Date:** 2026-02-21
**Status:** Approved
**Approach:** Schema-First (Approach A)

## Overview

Enrich the existing organizer-created badge system with categories, rarity tiers, and badge templates. No new tables — just new columns on `badges` and a static template array in the codebase.

## Database Schema Changes

Two new columns on the `badges` table:

```sql
ALTER TABLE badges
  ADD COLUMN category text DEFAULT 'special'
    CHECK (category IN ('distance', 'adventure', 'location', 'special')),
  ADD COLUMN rarity text DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));
```

### Category Values

| Value | Use case |
|-------|----------|
| `distance` | 5KM Finisher, Century Rider, Marathoner |
| `adventure` | First Summit, Mountain Conqueror, Trail Blazer |
| `location` | Cebu Trail Seeker, Luzon Explorer |
| `special` | Event-specific, limited edition, sponsored (default) |

### Rarity Values

| Value | Visual treatment | Meaning |
|-------|-----------------|---------|
| `common` | Gray border | Standard milestone |
| `rare` | Blue/teal glow | Requires effort |
| `epic` | Purple glow | Major achievement |
| `legendary` | Golden glow + shimmer | Elite |

### TypeScript Types

Update `src/lib/supabase/types.ts` badges table to include:
- `category: 'distance' | 'adventure' | 'location' | 'special'`
- `rarity: 'common' | 'rare' | 'epic' | 'legendary'`

## Badge Templates

Static array in `src/lib/constants/badge-templates.ts`. No DB table.

```ts
interface BadgeTemplate {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'adventure' | 'location' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  suggestedImage: string | null;
}
```

### Starter Templates (~20)

| Category | Templates |
|----------|-----------|
| **Distance** | 5KM Finisher (common), 10KM Finisher (common), Half Marathoner (rare), Marathoner (epic), Ultra Runner (legendary), 25KM Rider (common), 50KM Rider (rare), Century Rider (epic) |
| **Adventure** | First Summit (common), 3 Summits (rare), Mountain Conqueror (epic), Trail Blazer (common), Peak Seeker (rare) |
| **Location** | Cebu Trail Seeker (rare), Luzon Explorer (rare), Visayas Voyager (rare), Mindanao Pathfinder (rare), Philippine Adventurer (epic) |
| **Special** | Event Finisher (common), EventTara Pioneer (legendary) |

### UX Flow

1. Organizer sees a "Start from template" picker above the form (grid of template cards grouped by category tabs)
2. Clicking a template pre-fills title, description, category, and rarity
3. Organizer can edit all fields — templates are just a starting point
4. "Or create from scratch" option skips the picker

## Component Changes

### BadgeForm (organizer dashboard)

- Template picker at the top (collapsible grid, grouped by category tabs)
- Category dropdown — 4 options
- Rarity dropdown — 4 options with color indicators
- Rarity suggestion hint below dropdown (static mapping from template defaults)
- Template selection pre-fills all fields; organizer can override

### BadgeCard (profile/grid display)

- Rarity border ring: gray (common), teal (rare), purple (epic), golden with CSS shimmer (legendary)
- Small category pill below the event name

### Badge Detail Page (`/badges/[id]`)

- Rarity pill next to the title (hidden for common to reduce noise)
- Category shown below description
- Rarity ring on the hero image (same treatment as BadgeCard but larger)

### BadgeGrid (profile page)

- Optional category filter tabs above the grid ("All", "Distance", "Adventure", "Location", "Special")
- Only show tabs when user has badges in 2+ categories

### API Route (`POST /api/badges`)

- Accept `category` and `rarity` fields, pass through to upsert

## Seed Data

Existing `BADGE_DEFS` in `scripts/seed.ts` updated with category and rarity fields.

## Out of Scope

- Achievement engine (automatic cross-event badges)
- Social sharing of badges
- Badge walls / showcase pages
- Dynamic rarity recalculation
- New DB tables (badge_templates, badge_categories)
