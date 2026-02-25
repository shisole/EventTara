# Hiking Difficulty Rating with Mountain Picker

## Problem

Hiking events have no structured difficulty rating. Organizers describe difficulty in free-text descriptions, leading to inconsistency. Participants can't compare difficulty across events at a glance.

## Solution

Add a mountain database seeded with Panay island mountains and their difficulty ratings (using the Philippine mountaineering 1/9-9/9 scale). Hiking events link to one or more mountains, and the event's difficulty auto-fills from the hardest peak (organizer can override).

## Data Model

### New `mountains` table

| Column             | Type                | Notes                        |
| ------------------ | ------------------- | ---------------------------- |
| `id`               | uuid (PK)           | Auto-generated               |
| `name`             | text (not null)     | e.g., "Mt. Madja-as"         |
| `province`         | text (not null)     | e.g., "Antique"              |
| `difficulty_level` | smallint (not null) | 1-9, PH mountaineering scale |
| `elevation_masl`   | integer             | Meters above sea level       |
| `created_at`       | timestamptz         | Default now()                |

### New `event_mountains` junction table

| Column                | Type                                | Notes                                                       |
| --------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `id`                  | uuid (PK)                           | Auto-generated                                              |
| `event_id`            | uuid (FK -> events.id, not null)    | ON DELETE CASCADE                                           |
| `mountain_id`         | uuid (FK -> mountains.id, not null) | ON DELETE RESTRICT                                          |
| `route_name`          | text (nullable)                     | Optional: e.g., "Brgy. Bagay Trail", "Calinog Trail"        |
| `difficulty_override` | smallint (nullable)                 | 1-9, overrides mountain's default difficulty for this route |
| `sort_order`          | smallint                            | Order in traverse                                           |
| `created_at`          | timestamptz                         | Default now()                                               |

Unique constraint on `(event_id, mountain_id)`.

The mountain's `difficulty_level` is the default (standard/most common route). When linking a mountain to an event, the organizer can optionally name the specific route and override the difficulty. For example, Mt. Napulak defaults to 4/9 but via "Brgy. Bagay Trail" could be 3/9.

### Changes to `events` table

| New Column         | Type                | Notes                                                                                             |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| `difficulty_level` | smallint (nullable) | 1-9, auto-suggested from hardest mountain, organizer can override. Required when type = "hiking". |

## Organizer UX (Event Creation Form)

When `type === "hiking"` is selected:

1. **Mountain multi-select combobox** appears (similar to the existing guide picker). Shows: name, province, difficulty badge, elevation.
2. **Per-mountain route details** — for each selected mountain, organizer can optionally specify a route name and override the difficulty (e.g., Mt. Napulak via "Brgy. Bagay Trail" at 3/9 instead of the default 4/9).
3. **Event difficulty auto-fills** to the highest effective difficulty among selected mountains (considering any overrides).
4. **Organizer can override** the overall event difficulty — a traverse may be harder than any individual peak.
5. Mountain field sits between Location and the Guide picker in the form.

## Participant UX (Display)

### Event card

A small color-coded difficulty badge next to the event type badge:

| Range | Color  | Tailwind Palette |
| ----- | ------ | ---------------- |
| 1-4   | Green  | `forest`         |
| 5-7   | Orange | `golden`/amber   |
| 8-9   | Red    | red (default)    |

Format: `4/9` in a colored pill. For multi-mountain events: `8/9 - 3 peaks`.

### Event detail page

A dedicated section showing:

- Mountain name(s) with province
- Route name (if specified)
- Per-mountain difficulty badge (color-coded), showing override if different from default
- Elevation(s) in MASL
- Overall event difficulty badge
- For multi-peak: ordered list of mountains in the traverse

## Seed Data (Panay Mountains — Initial)

| Mountain      | Province | Elevation | Difficulty |
| ------------- | -------- | --------- | ---------- |
| Mt. Madja-as  | Antique  | 2,117m    | 8/9        |
| Mt. Nangtud   | Capiz    | 2,074m    | 8/9        |
| Mt. Baloy     | Antique  | 1,958m    | 9/9        |
| Mt. Balabag   | Antique  | 1,713m    | 6/9        |
| Mt. Agbalanti | Antique  | 1,579m    | 6/9        |
| Mt. Inaman    | Iloilo   | 1,396m    | 5/9        |
| Mt. Igdalig   | Iloilo   | 1,377m    | 5/9        |
| Mt. Napulak   | Iloilo   | 1,239m    | 4/9        |

Sources: PinoyMountaineer.com, PeakVisor, Wikipedia. Some difficulty ratings estimated where no official rating exists. Can be refined over time.

## API Changes

### `GET /api/mountains`

Returns all mountains. Supports `?province=` filter and `?search=` for combobox.

### `POST /api/events`

Accepts new fields for hiking events:

- `difficulty_level` (required) — overall event difficulty 1-9
- `mountains` (required) — array of `{ mountain_id, route_name?, difficulty_override?, sort_order }`

### `PATCH /api/events/[id]`

Same new fields as POST. Replaces existing event_mountains links.

### `GET /api/events` and `GET /api/events/[id]`

Response includes `difficulty_level` and linked mountains (with name, province, elevation, difficulty).

## Type Changes

Update `src/lib/supabase/types.ts`:

- Add `mountains` table type
- Add `event_mountains` table type (including `route_name` and `difficulty_override`)
- Add `difficulty_level` to `events` Row/Insert/Update types
