# Hiking Difficulty Rating Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a structured difficulty rating system for hiking events using the Philippine 1/9-9/9 mountaineering scale, with a mountain picker that supports multi-peak traversals and per-route difficulty overrides.

**Architecture:** New `mountains` and `event_mountains` tables in Supabase. Mountains API for the picker. EventForm gains a mountain multi-select combobox (hiking only) with optional route name and difficulty override per mountain. Event difficulty auto-fills from the hardest peak but organizer can override. Color-coded difficulty badges (green/orange/red) on event cards and detail pages.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (Postgres), Tailwind CSS, TypeScript

---

### Task 1: Create database tables via Supabase SQL

**Files:**

- Create: `supabase/migrations/20260226_add_mountains_and_difficulty.sql` (reference only — run in Supabase SQL editor)

**Step 1: Write the SQL migration**

Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Mountains table
CREATE TABLE mountains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province text NOT NULL,
  difficulty_level smallint NOT NULL CHECK (difficulty_level BETWEEN 1 AND 9),
  elevation_masl integer,
  created_at timestamptz DEFAULT now()
);

-- Event-mountains junction table
CREATE TABLE event_mountains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  mountain_id uuid NOT NULL REFERENCES mountains(id) ON DELETE RESTRICT,
  route_name text,
  difficulty_override smallint CHECK (difficulty_override IS NULL OR difficulty_override BETWEEN 1 AND 9),
  sort_order smallint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, mountain_id)
);

-- Add difficulty_level to events
ALTER TABLE events ADD COLUMN difficulty_level smallint CHECK (difficulty_level IS NULL OR difficulty_level BETWEEN 1 AND 9);

-- Enable RLS
ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_mountains ENABLE ROW LEVEL SECURITY;

-- Mountains: anyone can read
CREATE POLICY "Mountains are viewable by everyone"
  ON mountains FOR SELECT USING (true);

-- Event mountains: anyone can read
CREATE POLICY "Event mountains are viewable by everyone"
  ON event_mountains FOR SELECT USING (true);

-- Event mountains: authenticated users can insert/update/delete (event ownership checked in API)
CREATE POLICY "Authenticated users can manage event mountains"
  ON event_mountains FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for fast lookups
CREATE INDEX idx_event_mountains_event_id ON event_mountains(event_id);
CREATE INDEX idx_event_mountains_mountain_id ON event_mountains(mountain_id);
CREATE INDEX idx_mountains_province ON mountains(province);
```

**Step 2: Verify tables exist**

Run in SQL Editor:

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mountains';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_mountains';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'difficulty_level';
```

Expected: All columns listed correctly.

**Step 3: Seed initial mountain data**

Run in SQL Editor:

```sql
INSERT INTO mountains (name, province, difficulty_level, elevation_masl) VALUES
  ('Mt. Madja-as', 'Antique', 8, 2117),
  ('Mt. Nangtud', 'Capiz', 8, 2074),
  ('Mt. Baloy', 'Antique', 9, 1958),
  ('Mt. Balabag', 'Antique', 6, 1713),
  ('Mt. Agbalanti', 'Antique', 6, 1579),
  ('Mt. Inaman', 'Iloilo', 5, 1396),
  ('Mt. Igdalig', 'Iloilo', 5, 1377),
  ('Mt. Napulak', 'Iloilo', 4, 1239);
```

**Step 4: Commit a note about the migration**

```bash
git add -A && git commit -m "docs: note SQL migration for mountains tables"
```

---

### Task 2: Update TypeScript types

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add `mountains` table type**

After the `events` table type block (after line ~118, before `event_checkins`), add:

```typescript
      mountains: {
        Row: {
          id: string;
          name: string;
          province: string;
          difficulty_level: number;
          elevation_masl: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          province: string;
          difficulty_level: number;
          elevation_masl?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          province?: string;
          difficulty_level?: number;
          elevation_masl?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
```

**Step 2: Add `event_mountains` junction table type**

After the `mountains` type block, add:

```typescript
      event_mountains: {
        Row: {
          id: string;
          event_id: string;
          mountain_id: string;
          route_name: string | null;
          difficulty_override: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          mountain_id: string;
          route_name?: string | null;
          difficulty_override?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          mountain_id?: string;
          route_name?: string | null;
          difficulty_override?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
```

**Step 3: Add `difficulty_level` to `events` types**

In `events.Row` (after `cover_image_url`):

```typescript
difficulty_level: number | null;
```

In `events.Insert` (after `cover_image_url`):

```typescript
          difficulty_level?: number | null;
```

In `events.Update` (after `cover_image_url`):

```typescript
          difficulty_level?: number | null;
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 5: Commit**

```bash
git add src/lib/supabase/types.ts && git commit -m "feat: add mountains and event_mountains types, difficulty_level to events"
```

---

### Task 3: Add difficulty badge variants to UIBadge

**Files:**

- Modify: `src/components/ui/Badge.tsx`

**Step 1: Add difficulty variant styles**

In `variantStyles` object in `src/components/ui/Badge.tsx`, add after the `beta` entry:

```typescript
  difficulty_easy: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  difficulty_moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  difficulty_hard: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
```

**Step 2: Create DifficultyBadge helper component**

Create: `src/components/events/DifficultyBadge.tsx`

```tsx
import UIBadge from "@/components/ui/Badge";

interface DifficultyBadgeProps {
  level: number;
  className?: string;
}

function getDifficultyVariant(level: number): string {
  if (level <= 4) return "difficulty_easy";
  if (level <= 7) return "difficulty_moderate";
  return "difficulty_hard";
}

export default function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  return (
    <UIBadge variant={getDifficultyVariant(level)} className={className}>
      {level}/9
    </UIBadge>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/events/DifficultyBadge.tsx && git commit -m "feat: add difficulty badge variants and DifficultyBadge component"
```

---

### Task 4: Create Mountains API

**Files:**

- Create: `src/app/(frontend)/api/mountains/route.ts`

**Step 1: Implement GET /api/mountains**

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const search = searchParams.get("search");

  let query = supabase.from("mountains").select("*").order("name");

  if (province) {
    query = query.eq("province", province);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: mountains, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mountains });
}
```

**Step 2: Verify endpoint**

Run dev server and test: `curl http://localhost:3001/api/mountains`
Expected: JSON with `{ mountains: [...] }` containing the 8 seeded mountains.

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/api/mountains/route.ts && git commit -m "feat: add GET /api/mountains endpoint"
```

---

### Task 5: Create Event Mountains API

**Files:**

- Create: `src/app/(frontend)/api/events/[id]/mountains/route.ts`

**Step 1: Implement GET, POST, DELETE**

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: eventMountains, error } = await supabase
    .from("event_mountains")
    .select("id, mountain_id, route_name, difficulty_override, sort_order, created_at")
    .eq("event_id", id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!eventMountains || eventMountains.length === 0) {
    return NextResponse.json({ mountains: [] });
  }

  const mountainIds = eventMountains.map((em) => em.mountain_id);
  const { data: mountains } = await supabase
    .from("mountains")
    .select("id, name, province, difficulty_level, elevation_masl")
    .in("id", mountainIds);

  const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

  const result = eventMountains.map((em) => {
    const mountain = mountainMap.get(em.mountain_id);
    return {
      event_mountain_id: em.id,
      mountain_id: em.mountain_id,
      name: mountain?.name ?? "",
      province: mountain?.province ?? "",
      difficulty_level: mountain?.difficulty_level ?? 0,
      elevation_masl: mountain?.elevation_masl ?? null,
      route_name: em.route_name,
      difficulty_override: em.difficulty_override,
      sort_order: em.sort_order,
    };
  });

  return NextResponse.json({ mountains: result });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mountain_id, route_name, difficulty_override, sort_order } = body;

  // Check for existing link
  const { data: existing } = await supabase
    .from("event_mountains")
    .select("id")
    .eq("event_id", id)
    .eq("mountain_id", mountain_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Mountain already linked to this event" }, { status: 409 });
  }

  const { data: eventMountain, error } = await supabase
    .from("event_mountains")
    .insert({
      event_id: id,
      mountain_id,
      route_name: route_name || null,
      difficulty_override: difficulty_override || null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event_mountain: eventMountain });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mountain_id } = body;

  const { error } = await supabase
    .from("event_mountains")
    .delete()
    .eq("event_id", id)
    .eq("mountain_id", mountain_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add src/app/\(frontend\)/api/events/\[id\]/mountains/route.ts && git commit -m "feat: add event mountains API (GET/POST/DELETE)"
```

---

### Task 6: Update Events API to handle difficulty_level

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/route.ts`

**Step 1: Add difficulty_level to POST /api/events**

In `src/app/(frontend)/api/events/route.ts`, in the `POST` handler, add `difficulty_level` to the insert object (around line 278):

```typescript
      difficulty_level: body.difficulty_level ?? null,
```

Add it after `cover_image_url: body.cover_image_url,`.

**Step 2: Add difficulty_level to PUT /api/events/[id]**

In `src/app/(frontend)/api/events/[id]/route.ts`, in the `PUT` handler's update object (around line 53):

```typescript
      ...(body.difficulty_level !== undefined && { difficulty_level: body.difficulty_level }),
```

Add it after `cover_image_url: body.cover_image_url,`.

**Step 3: Add difficulty_level and mountains to GET /api/events list response**

In `src/app/(frontend)/api/events/route.ts`, in the `GET` handler, the event data already uses `select("*")` so `difficulty_level` will be included automatically. No changes needed for the list endpoint.

**Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 5: Commit**

```bash
git add src/app/\(frontend\)/api/events/route.ts src/app/\(frontend\)/api/events/\[id\]/route.ts && git commit -m "feat: add difficulty_level to event create/update APIs"
```

---

### Task 7: Build MountainCombobox component

**Files:**

- Create: `src/components/dashboard/MountainCombobox.tsx`

**Step 1: Create the MountainCombobox**

Follow the existing `GuideCombobox` pattern in `EventForm.tsx` (lines 51-214). The mountain combobox should:

- Accept `mountains` array, `selectedMountains` array, `onChange` callback, `loading` flag
- Show searchable dropdown with mountain name, province, difficulty badge, elevation
- Selected mountains display as removable chips with optional route name and difficulty override inputs
- Support drag-to-reorder or at least sort_order numbering

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import DifficultyBadge from "@/components/events/DifficultyBadge";
import { cn } from "@/lib/utils";

interface MountainOption {
  id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
}

export interface SelectedMountain {
  mountain_id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
  route_name: string;
  difficulty_override: number | null;
  sort_order: number;
}

interface MountainComboboxProps {
  mountains: MountainOption[];
  selectedMountains: SelectedMountain[];
  onChange: (mountains: SelectedMountain[]) => void;
  loading?: boolean;
}

export default function MountainCombobox({
  mountains,
  selectedMountains,
  onChange,
  loading = false,
}: MountainComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = new Set(selectedMountains.map((m) => m.mountain_id));

  const filtered = mountains.filter(
    (m) =>
      !selectedIds.has(m.id) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.province.toLowerCase().includes(search.toLowerCase())),
  );

  function addMountain(mountain: MountainOption) {
    const newSelected: SelectedMountain = {
      mountain_id: mountain.id,
      name: mountain.name,
      province: mountain.province,
      difficulty_level: mountain.difficulty_level,
      elevation_masl: mountain.elevation_masl,
      route_name: "",
      difficulty_override: null,
      sort_order: selectedMountains.length,
    };
    onChange([...selectedMountains, newSelected]);
    setSearch("");
  }

  function removeMountain(mountainId: string) {
    const updated = selectedMountains
      .filter((m) => m.mountain_id !== mountainId)
      .map((m, i) => ({ ...m, sort_order: i }));
    onChange(updated);
  }

  function updateMountain(
    mountainId: string,
    field: "route_name" | "difficulty_override",
    value: string | number | null,
  ) {
    onChange(
      selectedMountains.map((m) => (m.mountain_id === mountainId ? { ...m, [field]: value } : m)),
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Mountain(s)
      </label>

      {/* Selected mountains */}
      {selectedMountains.length > 0 && (
        <div className="space-y-2">
          {selectedMountains.map((m, index) => (
            <div
              key={m.mountain_id}
              className="flex flex-col gap-2 p-3 rounded-lg bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">{index + 1}.</span>
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.province}</span>
                  <DifficultyBadge level={m.difficulty_override ?? m.difficulty_level} />
                  {m.elevation_masl && (
                    <span className="text-xs text-gray-400">
                      {m.elevation_masl.toLocaleString()} MASL
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeMountain(m.mountain_id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Route name (optional)"
                  value={m.route_name}
                  onChange={(e) => updateMountain(m.mountain_id, "route_name", e.target.value)}
                  className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                <select
                  value={m.difficulty_override ?? ""}
                  onChange={(e) =>
                    updateMountain(
                      m.mountain_id,
                      "difficulty_override",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <option value="">Default ({m.difficulty_level}/9)</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}/9
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder={loading ? "Loading mountains..." : "Search mountains..."}
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          disabled={loading}
          className={cn(
            "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm",
            loading && "opacity-50",
          )}
        />

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => addMountain(m)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.province}</span>
                  <DifficultyBadge level={m.difficulty_level} />
                  {m.elevation_masl && (
                    <span className="text-xs text-gray-400">
                      {m.elevation_masl.toLocaleString()}m
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && !loading && filtered.length === 0 && search && (
          <div className="absolute z-10 mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm text-gray-500">
            No mountains found
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/MountainCombobox.tsx && git commit -m "feat: add MountainCombobox component for hiking events"
```

---

### Task 8: Integrate mountain picker and difficulty into EventForm

**Files:**

- Modify: `src/components/dashboard/EventForm.tsx`

**Step 1: Add imports**

Add at top of file:

```typescript
import MountainCombobox, { type SelectedMountain } from "./MountainCombobox";
import DifficultyBadge from "@/components/events/DifficultyBadge";
```

**Step 2: Extend EventFormProps.initialData**

Add to the `initialData` interface:

```typescript
    initialMountains?: SelectedMountain[];
    difficulty_level?: number | null;
```

**Step 3: Add mountain state**

Add alongside the guide selection state (around line 248):

```typescript
const [selectedMountains, setSelectedMountains] = useState<SelectedMountain[]>(
  initialData?.initialMountains || [],
);
const [availableMountains, setAvailableMountains] = useState<
  {
    id: string;
    name: string;
    province: string;
    difficulty_level: number;
    elevation_masl: number | null;
  }[]
>([]);
const [loadingMountains, setLoadingMountains] = useState(false);
const [difficultyLevel, setDifficultyLevel] = useState<number | null>(
  initialData?.difficulty_level ?? null,
);
```

**Step 4: Add mountain fetch effect**

Add after the guide fetch effect:

```typescript
useEffect(() => {
  if (type !== "hiking") {
    setAvailableMountains([]);
    return;
  }
  const fetchMountains = async () => {
    setLoadingMountains(true);
    const res = await fetch("/api/mountains");
    if (res.ok) {
      const data = await res.json();
      setAvailableMountains(data.mountains);
    }
    setLoadingMountains(false);
  };
  fetchMountains();
}, [type]);
```

**Step 5: Add auto-fill difficulty effect**

```typescript
useEffect(() => {
  if (selectedMountains.length === 0) {
    setDifficultyLevel(null);
    return;
  }
  const maxDifficulty = Math.max(
    ...selectedMountains.map((m) => m.difficulty_override ?? m.difficulty_level),
  );
  setDifficultyLevel(maxDifficulty);
}, [selectedMountains]);
```

**Step 6: Add difficulty_level to form submission**

In the `handleSubmit` function, add `difficulty_level: difficultyLevel` to the body object sent to POST/PUT.

**Step 7: Add mountain syncing to handleSubmit**

After the event is created/updated (similar to the guide syncing pattern at lines 335-370):

```typescript
// Sync mountains for hiking events
if (type === "hiking" && eventId) {
  const currentRes = await fetch(`/api/events/${eventId}/mountains`);
  const currentData = await currentRes.json();
  const currentMountainIds = new Set(
    (currentData.mountains || []).map((m: { mountain_id: string }) => m.mountain_id),
  );
  const newMountainIds = new Set(selectedMountains.map((m) => m.mountain_id));

  // Delete removed mountains
  for (const current of currentData.mountains || []) {
    if (!newMountainIds.has(current.mountain_id)) {
      await fetch(`/api/events/${eventId}/mountains`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mountain_id: current.mountain_id }),
      });
    }
  }

  // Add new mountains
  for (const selected of selectedMountains) {
    if (!currentMountainIds.has(selected.mountain_id)) {
      await fetch(`/api/events/${eventId}/mountains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mountain_id: selected.mountain_id,
          route_name: selected.route_name || null,
          difficulty_override: selected.difficulty_override,
          sort_order: selected.sort_order,
        }),
      });
    }
  }
}
```

**Step 8: Add mountain combobox and difficulty override to form JSX**

Add the mountain picker conditionally rendered when `type === "hiking"`, placed BEFORE the guide picker section:

```tsx
{
  type === "hiking" && (
    <>
      <MountainCombobox
        mountains={availableMountains}
        selectedMountains={selectedMountains}
        onChange={setSelectedMountains}
        loading={loadingMountains}
      />
      {selectedMountains.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Event Difficulty
          </label>
          <div className="flex items-center gap-3">
            <select
              value={difficultyLevel ?? ""}
              onChange={(e) => setDifficultyLevel(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}/9
                </option>
              ))}
            </select>
            {difficultyLevel && <DifficultyBadge level={difficultyLevel} />}
          </div>
          <p className="text-xs text-gray-500">
            Auto-set to highest peak difficulty. Override if the traverse is harder.
          </p>
        </div>
      )}
    </>
  );
}
```

**Step 9: Verify form renders correctly**

Run: `npm run dev`
Navigate to Dashboard > Events > New. Select "Hiking" as type. Verify:

- Mountain picker appears
- Can search and select mountains
- Difficulty auto-fills
- Route name and difficulty override work per mountain
- Overall difficulty can be overridden

**Step 10: Commit**

```bash
git add src/components/dashboard/EventForm.tsx && git commit -m "feat: integrate mountain picker and difficulty into EventForm"
```

---

### Task 9: Display difficulty badge on EventCard

**Files:**

- Modify: `src/components/events/EventCard.tsx`

**Step 1: Add difficulty_level to EventCardProps**

```typescript
  difficulty_level?: number | null;
```

**Step 2: Add difficulty_level to destructured props**

**Step 3: Add DifficultyBadge import**

```typescript
import DifficultyBadge from "./DifficultyBadge";
```

**Step 4: Render badge next to event type badge**

After the `<UIBadge variant={type}>` line (line 98), add:

```tsx
{
  difficulty_level != null && <DifficultyBadge level={difficulty_level} />;
}
```

**Step 5: Pass difficulty_level from events listing page**

In `src/app/(frontend)/(participant)/events/page.tsx`, find where `EventCard` is rendered and add `difficulty_level={event.difficulty_level}` to the props.

**Step 6: Verify display**

Navigate to `/events` page. Hiking events with difficulty set should show the colored badge next to the "Hiking" badge.

**Step 7: Commit**

```bash
git add src/components/events/EventCard.tsx src/app/\(frontend\)/\(participant\)/events/page.tsx && git commit -m "feat: show difficulty badge on EventCard for hiking events"
```

---

### Task 10: Display mountains and difficulty on event detail page

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx`

**Step 1: Fetch event mountains for hiking events**

After the existing guide-fetching block, add a similar block to fetch mountains:

```typescript
let eventMountains: {
  mountain_id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
  route_name: string | null;
  difficulty_override: number | null;
  sort_order: number;
}[] = [];

if (event.type === "hiking") {
  const { data: emRows } = await supabase
    .from("event_mountains")
    .select("mountain_id, route_name, difficulty_override, sort_order")
    .eq("event_id", id)
    .order("sort_order");

  if (emRows && emRows.length > 0) {
    const mountainIds = emRows.map((em) => em.mountain_id);
    const { data: mountains } = await supabase
      .from("mountains")
      .select("id, name, province, difficulty_level, elevation_masl")
      .in("id", mountainIds);

    const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

    eventMountains = emRows.map((em) => {
      const mountain = mountainMap.get(em.mountain_id);
      return {
        mountain_id: em.mountain_id,
        name: mountain?.name ?? "",
        province: mountain?.province ?? "",
        difficulty_level: mountain?.difficulty_level ?? 0,
        elevation_masl: mountain?.elevation_masl ?? null,
        route_name: em.route_name,
        difficulty_override: em.difficulty_override,
        sort_order: em.sort_order,
      };
    });
  }
}
```

**Step 2: Add mountain info section to the detail page sidebar**

Add a "Mountains" section in the sidebar (before the Guides section), following the same card pattern:

```tsx
{
  eventMountains.length > 0 && (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6">
      <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
        <span className="text-lg">⛰️</span>
        {eventMountains.length === 1 ? "Mountain" : `Mountains (${eventMountains.length} peaks)`}
      </h3>
      {event.difficulty_level && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500">Overall Difficulty:</span>
          <DifficultyBadge level={event.difficulty_level} />
        </div>
      )}
      <div className="space-y-3">
        {eventMountains.map((m, i) => (
          <div
            key={m.mountain_id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <span className="text-sm font-bold text-gray-400 mt-0.5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{m.name}</span>
                <DifficultyBadge level={m.difficulty_override ?? m.difficulty_level} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{m.province}</span>
                {m.elevation_masl && (
                  <>
                    <span>·</span>
                    <span>{m.elevation_masl.toLocaleString()} MASL</span>
                  </>
                )}
                {m.route_name && (
                  <>
                    <span>·</span>
                    <span>{m.route_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Add DifficultyBadge import**

```typescript
import DifficultyBadge from "@/components/events/DifficultyBadge";
```

**Step 4: Also show difficulty badge in the event header area**

Near the event type badge in the hero section, add the difficulty badge next to it (similar to EventCard).

**Step 5: Verify display**

Navigate to a hiking event detail page that has mountains linked. Verify mountains section renders with correct data.

**Step 6: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/events/\[id\]/page.tsx && git commit -m "feat: display mountains and difficulty on event detail page"
```

---

### Task 11: Load initial mountains when editing an event

**Files:**

- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/edit/page.tsx`

**Step 1: Fetch event mountains for initialData**

In the edit page's server component, after fetching the event data, fetch the linked mountains:

```typescript
let initialMountains: SelectedMountain[] = [];
if (event.type === "hiking") {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/events/${id}/mountains`);
  // Or use supabase directly:
  const { data: emRows } = await supabase
    .from("event_mountains")
    .select("mountain_id, route_name, difficulty_override, sort_order")
    .eq("event_id", id)
    .order("sort_order");

  if (emRows && emRows.length > 0) {
    const mountainIds = emRows.map((em) => em.mountain_id);
    const { data: mountains } = await supabase
      .from("mountains")
      .select("id, name, province, difficulty_level, elevation_masl")
      .in("id", mountainIds);

    const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

    initialMountains = emRows.map((em) => {
      const mountain = mountainMap.get(em.mountain_id);
      return {
        mountain_id: em.mountain_id,
        name: mountain?.name ?? "",
        province: mountain?.province ?? "",
        difficulty_level: mountain?.difficulty_level ?? 0,
        elevation_masl: mountain?.elevation_masl ?? null,
        route_name: em.route_name ?? "",
        difficulty_override: em.difficulty_override,
        sort_order: em.sort_order,
      };
    });
  }
}
```

**Step 2: Pass to EventForm**

Add `initialMountains` and `difficulty_level` to the `initialData` prop passed to `EventForm`.

**Step 3: Verify edit flow**

Navigate to Dashboard > edit a hiking event. Verify mountains are pre-populated in the combobox.

**Step 4: Commit**

```bash
git add src/app/\(frontend\)/\(organizer\)/dashboard/events/\[id\]/edit/page.tsx && git commit -m "feat: load initial mountains when editing hiking events"
```

---

### Task 12: Update seed script with mountain data for test events

**Files:**

- Modify: `scripts/seed.ts`

**Step 1: Add mountain seeding logic**

After the existing seed data insertions, add:

- Insert the 8 Panay mountains (same as the SQL seed, but via Supabase client for the seed script)
- Link some hiking test events to mountains with route names and difficulty overrides
- Set `difficulty_level` on hiking test events

**Step 2: Update unseed to clean up**

Add cleanup for `event_mountains` and `mountains` tables in the unseed flow.

**Step 3: Test seed/unseed**

Run: `npm run unseed && npm run seed`
Expected: Seed completes without errors, mountains are linked to hiking events.

**Step 4: Commit**

```bash
git add scripts/seed.ts && git commit -m "feat: seed mountains and link to hiking test events"
```

---

### Task 13: Final integration testing and cleanup

**Step 1: Full flow test**

1. Create a new hiking event, select 2-3 mountains, set route names, override one difficulty
2. Verify difficulty auto-fills correctly
3. Save event, verify it appears in listing with difficulty badge
4. View event detail page, verify mountains section renders
5. Edit the event, verify mountains are pre-loaded, make changes, save
6. Verify changes persist

**Step 2: Non-hiking event regression**

1. Create/edit a non-hiking event (MTB, running, etc.)
2. Verify no mountain picker or difficulty fields appear
3. Verify existing events still display correctly

**Step 3: Build check**

Run: `npm run build`
Expected: Clean build with no errors.

**Step 4: Lint check**

Run: `npm run lint`
Expected: No lint errors.

**Step 5: Final commit**

```bash
git add -A && git commit -m "feat: hiking difficulty rating with mountain picker - complete"
```
