# Event Itinerary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional time-based itinerary to events, managed by organizers on a dedicated sub-page, displayed as a public timeline below the event description.

**Architecture:** New `event_itinerary` Supabase table stores ordered entries (free-text time + title). A `nextSortOrder` pure utility is unit-tested. API routes under `src/app/(frontend)/api/` handle CRUD and bulk reorder. `ItineraryManager` client component uses the existing `SortableList` from `@/components/ui` for drag-to-reorder. `EventItinerary` renders a teal timeline on the public event page, hidden when empty.

**Tech Stack:** Next.js 15 App Router, Supabase, `@dnd-kit/sortable` (via existing `SortableList` component), TypeScript, Vitest.

---

## File Map

**New files:**

- `src/lib/itinerary/sort.ts` — `nextSortOrder` pure utility
- `src/lib/itinerary/__tests__/sort.test.ts` — unit tests
- `src/app/(frontend)/api/events/[id]/itinerary/route.ts` — GET + POST + PATCH (bulk reorder)
- `src/app/(frontend)/api/events/[id]/itinerary/[entryId]/route.ts` — PATCH (edit) + DELETE
- `src/components/events/EventItinerary.tsx` — public timeline component
- `src/components/dashboard/ItineraryManager.tsx` — organizer CRUD component
- `src/app/(frontend)/(organizer)/dashboard/events/[id]/itinerary/page.tsx` — legacy organizer page
- `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/itinerary/page.tsx` — club-scoped organizer page

**Modified files:**

- `src/lib/supabase/types.ts` — add `event_itinerary` Row/Insert/Update types
- `src/app/(frontend)/(participant)/events/[id]/page.tsx` — fetch itinerary, render `EventItinerary`
- `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx` — add Itinerary button
- `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/page.tsx` — add Itinerary button

---

## Task 1: Add TypeScript types for event_itinerary

**Files:**

- Modify: `src/lib/supabase/types.ts`

- [ ] **Step 1: Insert event_itinerary block into types.ts**

Open `src/lib/supabase/types.ts`. Find the `event_guides:` table block (search for `event_guides: {`). Insert the following block **immediately before** it:

```typescript
      event_itinerary: {
        Row: {
          id: string;
          event_id: string;
          time: string;
          title: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          time: string;
          title: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          time?: string;
          title?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_itinerary_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat(itinerary): add event_itinerary Supabase types"
```

---

## Task 2: nextSortOrder utility + unit tests

**Files:**

- Create: `src/lib/itinerary/sort.ts`
- Create: `src/lib/itinerary/__tests__/sort.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/itinerary/__tests__/sort.test.ts`:

```typescript
import { nextSortOrder } from "@/lib/itinerary/sort";

describe("nextSortOrder", () => {
  test("returns 0 for an empty list", () => {
    expect(nextSortOrder([])).toBe(0);
  });

  test("returns max + 1 for a contiguous list", () => {
    expect(nextSortOrder([{ sort_order: 0 }, { sort_order: 1 }, { sort_order: 2 }])).toBe(3);
  });

  test("returns max + 1 for a non-contiguous list", () => {
    expect(nextSortOrder([{ sort_order: 0 }, { sort_order: 5 }, { sort_order: 3 }])).toBe(6);
  });

  test("returns max + 1 for a single entry", () => {
    expect(nextSortOrder([{ sort_order: 7 }])).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/itinerary/__tests__/sort.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/itinerary/sort'"

- [ ] **Step 3: Implement the utility**

Create `src/lib/itinerary/sort.ts`:

```typescript
export function nextSortOrder(entries: { sort_order: number }[]): number {
  if (entries.length === 0) return 0;
  return Math.max(...entries.map((e) => e.sort_order)) + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test src/lib/itinerary/__tests__/sort.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/itinerary/sort.ts src/lib/itinerary/__tests__/sort.test.ts
git commit -m "feat(itinerary): add nextSortOrder utility with unit tests"
```

---

## Task 3: API route — collection (GET + POST + PATCH bulk reorder)

**Files:**

- Create: `src/app/(frontend)/api/events/[id]/itinerary/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { type NextRequest, NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { nextSortOrder } from "@/lib/itinerary/sort";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("event_itinerary")
    .select("id, time, title, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: entries ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let time: string;
  let title: string;
  try {
    const body = await request.json();
    time = String(body.time ?? "").trim();
    title = String(body.title ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!time || !title) {
    return NextResponse.json({ error: "time and title are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("event_itinerary")
    .select("sort_order")
    .eq("event_id", eventId);

  const sort_order = nextSortOrder(existing ?? []);

  const { data: entry, error } = await supabase
    .from("event_itinerary")
    .insert({ event_id: eventId, time, title, sort_order })
    .select("id, time, title, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry }, { status: 201 });
}

// Bulk reorder: body = { order: Array<{ id: string; sort_order: number }> }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let order: { id: string; sort_order: number }[];
  try {
    const body = await request.json();
    order = body.order;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array" }, { status: 400 });
  }

  await Promise.all(
    order.map(({ id, sort_order }) =>
      supabase.from("event_itinerary").update({ sort_order }).eq("id", id).eq("event_id", eventId),
    ),
  );

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/api/events/[id]/itinerary/route.ts"
git commit -m "feat(itinerary): add collection API route (GET/POST/PATCH)"
```

---

## Task 4: API route — single entry (PATCH + DELETE)

**Files:**

- Create: `src/app/(frontend)/api/events/[id]/itinerary/[entryId]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { type NextRequest, NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { id: eventId, entryId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existingEntry } = await supabase
    .from("event_itinerary")
    .select("id")
    .eq("id", entryId)
    .eq("event_id", eventId)
    .single();

  if (!existingEntry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  let time: string | undefined;
  let title: string | undefined;
  try {
    const body = await request.json();
    if (body.time !== undefined) time = String(body.time).trim();
    if (body.title !== undefined) title = String(body.title).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: { time?: string; title?: string } = {};
  if (time !== undefined) updates.time = time;
  if (title !== undefined) updates.title = title;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data: entry, error } = await supabase
    .from("event_itinerary")
    .update(updates)
    .eq("id", entryId)
    .select("id, time, title, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { id: eventId, entryId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("event_itinerary")
    .delete()
    .eq("id", entryId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/api/events/[id]/itinerary/[entryId]/route.ts"
git commit -m "feat(itinerary): add single-entry API route (PATCH/DELETE)"
```

---

## Task 5: Public EventItinerary component

**Files:**

- Create: `src/components/events/EventItinerary.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface ItineraryEntry {
  id: string;
  time: string;
  title: string;
  sort_order: number;
}

interface EventItineraryProps {
  entries: ItineraryEntry[];
}

export default function EventItinerary({ entries }: EventItineraryProps) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Itinerary</h2>
      <div className="relative pl-5">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <ol className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-gray-900 shadow-sm" />
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 leading-none mb-0.5">
                {entry.time}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{entry.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/EventItinerary.tsx
git commit -m "feat(itinerary): add EventItinerary public timeline component"
```

---

## Task 6: Fetch and render itinerary on the public event page

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx`

- [ ] **Step 1: Add the itinerary fetch**

In `src/app/(frontend)/(participant)/events/[id]/page.tsx`, find this line (around line 279):

```typescript
// Fetch event route (if attached)
const { data: eventRoute } = await supabase;
```

Insert the following block immediately **before** it:

```typescript
// Fetch itinerary entries
const { data: itineraryRows } = await supabase
  .from("event_itinerary")
  .select("id, time, title, sort_order")
  .eq("event_id", id)
  .order("sort_order", { ascending: true });

const itineraryEntries = itineraryRows ?? [];
```

- [ ] **Step 2: Add the import**

In the imports section at the top, add `EventItinerary` alphabetically with the other `@/components/events/` imports:

```typescript
import EventItinerary from "@/components/events/EventItinerary";
```

- [ ] **Step 3: Render the component below the description**

Find the description block in the JSX (around line 462):

```tsx
{
  event.description && (
    <div>
      <h2 className="text-xl font-heading font-bold mb-3">About This Event</h2>
      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.description}</p>
    </div>
  );
}
```

After the closing `</div>` of that block, add:

```tsx
<EventItinerary entries={itineraryEntries} />
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 5: Smoke test in browser**

```bash
pnpm dev
```

Open any event page at `http://localhost:3001/events/[id]`. Verify no itinerary section appears (no entries exist yet in the DB). No console errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(frontend)/(participant)/events/[id]/page.tsx"
git commit -m "feat(itinerary): fetch and render itinerary on public event page"
```

---

## Task 7: ItineraryManager organizer component

**Files:**

- Create: `src/components/dashboard/ItineraryManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, DragHandleButton, Input, SortableList } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ItineraryEntry {
  id: string;
  time: string;
  title: string;
  sort_order: number;
}

interface ItineraryManagerProps {
  eventId: string;
  initialEntries: ItineraryEntry[];
}

export default function ItineraryManager({ eventId, initialEntries }: ItineraryManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ItineraryEntry[]>(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!newTime.trim() || !newTitle.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}/itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: newTime.trim(), title: newTitle.trim() }),
    });

    if (res.ok) {
      const json: { entry: ItineraryEntry } = await res.json();
      setEntries((prev) => [...prev, json.entry]);
      setNewTime("");
      setNewTitle("");
      router.refresh();
    } else {
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to add entry");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));

    const res = await fetch(`/api/events/${eventId}/itinerary/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setEntries(initialEntries);
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to delete entry");
    } else {
      router.refresh();
    }
  }

  function startEdit(entry: ItineraryEntry) {
    setEditingId(entry.id);
    setEditTime(entry.time);
    setEditTitle(entry.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTime("");
    setEditTitle("");
    setError("");
  }

  async function handleSaveEdit(id: string) {
    if (!editTime.trim() || !editTitle.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}/itinerary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: editTime.trim(), title: editTitle.trim() }),
    });

    if (res.ok) {
      const json: { entry: ItineraryEntry } = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? json.entry : e)));
      setEditingId(null);
      router.refresh();
    } else {
      const json: { error?: string } = await res.json();
      setError(json.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function handleReorder(reordered: ItineraryEntry[]) {
    const updated = reordered.map((e, i) => ({ ...e, sort_order: i }));
    setEntries(updated);

    await fetch(`/api/events/${eventId}/itinerary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: updated.map(({ id, sort_order }) => ({ id, sort_order })) }),
    });

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {entries.length > 0 ? (
        <SortableList
          items={entries}
          onReorder={handleReorder}
          renderRow={({ item: entry, dragHandleProps }) => {
            if (editingId === entry.id) {
              return (
                <div className="flex items-center gap-2 border border-teal-400 dark:border-teal-600 rounded-xl p-3 bg-white dark:bg-gray-900">
                  <DragHandleButton dragHandleProps={dragHandleProps} />
                  <Input
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="Time"
                    className="w-28 text-sm"
                  />
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSaveEdit(entry.id)}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              );
            }

            return (
              <div
                className={cn(
                  "flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900",
                )}
              >
                <DragHandleButton dragHandleProps={dragHandleProps} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {entry.time}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{entry.title}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEdit(entry)}>
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => void handleDelete(entry.id)}
                  className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Delete entry"
                >
                  ×
                </button>
              </div>
            );
          }}
        />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No itinerary entries yet. Add the first one below.
        </p>
      )}

      {/* Add form */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Add Entry
        </p>
        <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
          <div className="w-full sm:w-28 shrink-0">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
            <Input
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="e.g. 4:00 AM"
              className="text-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Assembly at trailhead"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => void handleAdd()}
            disabled={saving || !newTime.trim() || !newTitle.trim()}
            className="shrink-0"
          >
            + Add
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: exits 0, no errors or warnings.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ItineraryManager.tsx
git commit -m "feat(itinerary): add ItineraryManager organizer component"
```

---

## Task 8: Organizer pages and dashboard links

**Files:**

- Create: `src/app/(frontend)/(organizer)/dashboard/events/[id]/itinerary/page.tsx`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/itinerary/page.tsx`
- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx`
- Modify: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/page.tsx`

- [ ] **Step 1: Create legacy organizer itinerary page**

Create `src/app/(frontend)/(organizer)/dashboard/events/[id]/itinerary/page.tsx`:

```typescript
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ItineraryManager from "@/components/dashboard/ItineraryManager";
import { ChevronLeftIcon } from "@/components/icons";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Event Itinerary — EventTara" };

export default async function EventItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: entries } = await supabase
    .from("event_itinerary")
    .select("id, time, title, sort_order")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto">
      <BreadcrumbTitle title={event.title} />
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Event
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Event Itinerary</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Optional — leave empty to hide from participants.
        </p>
      </div>
      <ItineraryManager eventId={id} initialEntries={entries ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Create club-scoped organizer itinerary page**

Create `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/itinerary/page.tsx`:

```typescript
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ItineraryManager from "@/components/dashboard/ItineraryManager";
import { ChevronLeftIcon } from "@/components/icons";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Event Itinerary — EventTara" };

export default async function ClubEventItineraryPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: entries } = await supabase
    .from("event_itinerary")
    .select("id, time, title, sort_order")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  const eventsBase = `/dashboard/clubs/${slug}/events`;

  return (
    <div className="max-w-2xl mx-auto">
      <BreadcrumbTitle title={event.title} />
      <Link
        href={`${eventsBase}/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Event
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Event Itinerary</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Optional — leave empty to hide from participants.
        </p>
      </div>
      <ItineraryManager eventId={id} initialEntries={entries ?? []} />
    </div>
  );
}
```

- [ ] **Step 3: Add Itinerary button to legacy event dashboard**

In `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx`, find (around line 164):

```tsx
<Link href={`/dashboard/events/${id}/edit`}>
  <Button variant="outline">Edit</Button>
</Link>
```

Add immediately after the closing `</Link>`:

```tsx
<Link href={`/dashboard/events/${id}/itinerary`}>
  <Button variant="outline">Itinerary</Button>
</Link>
```

- [ ] **Step 4: Add Itinerary button to club-scoped event dashboard**

In `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/page.tsx`, find (around line 155):

```tsx
<Link href={`${eventsBase}/${id}/edit`}>
  <Button variant="outline">Edit</Button>
</Link>
```

Add immediately after:

```tsx
<Link href={`${eventsBase}/${id}/itinerary`}>
  <Button variant="outline">Itinerary</Button>
</Link>
```

- [ ] **Step 5: Run full check**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: exits 0. All 4 `nextSortOrder` tests pass alongside the rest of the suite.

- [ ] **Step 6: Commit**

```bash
git add \
  "src/app/(frontend)/(organizer)/dashboard/events/[id]/itinerary/page.tsx" \
  "src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/itinerary/page.tsx" \
  "src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx" \
  "src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/page.tsx"
git commit -m "feat(itinerary): add organizer itinerary pages and dashboard links"
```

---

## Final Verification

- [ ] **Manual smoke test**

```bash
pnpm dev
```

1. Log in as an organizer. Open any event dashboard (`/dashboard/events/[id]` or `/dashboard/clubs/[slug]/events/[id]`). Verify the **Itinerary** button appears next to Edit.
2. Click Itinerary. Verify the page loads with empty state and an Add Entry form.
3. Add two entries (e.g. "4:00 AM / Assembly", "6:00 AM / Start"). Verify they appear in the list.
4. Drag to reorder. Verify order persists after page refresh.
5. Edit an entry. Verify the change is saved.
6. Delete an entry. Verify it disappears.
7. Open the public event page (`/events/[id]`). Verify the Itinerary section appears below "About This Event" with a teal timeline.
8. Delete all entries from the organizer page. Reload the public page. Verify the Itinerary section is gone.

- [ ] **Reminder: create the Supabase table**

Before testing, create the `event_itinerary` table in Supabase with this SQL:

```sql
create table public.event_itinerary (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  time text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast per-event queries
create index event_itinerary_event_id_idx on public.event_itinerary(event_id);

-- RLS
alter table public.event_itinerary enable row level security;

create policy "Public read" on public.event_itinerary
  for select using (true);

create policy "Club members can write" on public.event_itinerary
  for all using (
    exists (
      select 1 from public.events e
      join public.club_members cm on cm.club_id = e.club_id
      where e.id = event_itinerary.event_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner', 'admin', 'moderator')
    )
  );
```

Run this in the Supabase SQL editor before starting the dev server.
