# Club Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the participant/organizer user model with a club-based community architecture where users create/join clubs, clubs own events, and club membership determines permissions via RBAC.

**Architecture:** New `clubs`, `club_members`, and `club_invites` tables replace `organizer_profiles`. Events link to `club_id` instead of `organizer_id`. Three-tier RBAC (owner/admin/moderator) plus member role. Dashboard restructured around club context with a club switcher. User role simplified to `user` or `guest`.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (Postgres + RLS), TypeScript, Tailwind CSS, Vitest

**Design doc:** `docs/plans/2026-03-08-club-architecture-design.md`

---

## Task 1: Database Migration SQL

Create the migration file with all schema changes. The user will run this manually in Supabase.

**Files:**

- Create: `supabase/migrations/012_clubs.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Migration: organizer_profiles → clubs
-- ============================================================

-- 1. Create clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  activity_types TEXT[] NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  payment_info JSONB,
  location TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_visibility ON clubs(visibility);

-- 2. Create club_members table
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);
CREATE INDEX idx_club_members_role ON club_members(role);

-- 3. Create club_invites table
CREATE TABLE club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  max_uses INT,
  uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_invites_code ON club_invites(invite_code);
CREATE INDEX idx_club_invites_club_id ON club_invites(club_id);

-- 4. Migrate organizer_profiles → clubs
INSERT INTO clubs (id, name, slug, description, logo_url, payment_info, is_demo, created_at)
SELECT
  id,
  org_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
  description,
  logo_url,
  payment_info,
  COALESCE(is_demo, false),
  created_at
FROM organizer_profiles;

-- 5. Create club_members entries for existing organizers (as owners)
INSERT INTO club_members (club_id, user_id, role)
SELECT id, user_id, 'owner'
FROM organizer_profiles
WHERE user_id IS NOT NULL;

-- 6. Add club_id to events (initially nullable for migration)
ALTER TABLE events ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;

-- 7. Copy organizer_id values to club_id
UPDATE events SET club_id = organizer_id;

-- 8. Make club_id NOT NULL after data migration
ALTER TABLE events ALTER COLUMN club_id SET NOT NULL;

-- 9. Create index on events.club_id
CREATE INDEX idx_events_club_id ON events(club_id);

-- 10. Rename organizer_reviews → club_reviews
ALTER TABLE organizer_reviews RENAME TO club_reviews;
ALTER TABLE club_reviews RENAME COLUMN organizer_id TO club_id;

-- 11. Rename organizer_review_photos → club_review_photos
ALTER TABLE organizer_review_photos RENAME TO club_review_photos;

-- 12. Update user roles: organizer/participant → user
UPDATE users SET role = 'user' WHERE role IN ('organizer', 'participant');

-- 13. RLS policies for clubs (public read, member write)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Club owner/admin can update"
  ON clubs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Club owner can delete"
  ON clubs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'owner'
    )
  );

-- 14. RLS policies for club_members
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club members"
  ON club_members FOR SELECT USING (true);

CREATE POLICY "Users can join public clubs"
  ON club_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_id AND clubs.visibility = 'public')
      OR role = 'owner'
    )
  );

CREATE POLICY "Owner/admin can manage members"
  ON club_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members AS cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owner/admin can remove members or self-leave"
  ON club_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_members AS cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- 15. RLS policies for club_invites
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invites by code"
  ON club_invites FOR SELECT USING (true);

CREATE POLICY "Owner/admin can create invites"
  ON club_invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_invites.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owner/admin can delete invites"
  ON club_invites FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_invites.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- Note: Do NOT drop organizer_profiles or events.organizer_id yet.
-- Keep them until all code is migrated and verified. Drop in a later migration.
```

**Step 2: Commit**

```bash
git add supabase/migrations/012_clubs.sql
git commit -m "feat: add clubs migration SQL (organizer_profiles → clubs)"
```

---

## Task 2: TypeScript Types

Update the Supabase types and add new type definitions for clubs.

**Files:**

- Modify: `src/lib/supabase/types.ts`
- Create: `src/lib/clubs/types.ts`
- Create: `src/lib/clubs/permissions.ts`

**Step 1: Add club types to `src/lib/clubs/types.ts`**

```typescript
export type ClubRole = "owner" | "admin" | "moderator" | "member";

export type ClubVisibility = "public" | "private";

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  activity_types: string[];
  visibility: ClubVisibility;
  payment_info: Record<string, unknown> | null;
  location: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubRole;
  joined_at: string;
}

export interface ClubInvite {
  id: string;
  club_id: string;
  invited_by: string;
  invite_code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

/** Club with aggregated member count (for list views) */
export interface ClubWithStats extends Club {
  member_count: number;
  event_count: number;
}

/** Club member with joined user data (for member lists) */
export interface ClubMemberWithUser extends ClubMember {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}
```

**Step 2: Add permission helper to `src/lib/clubs/permissions.ts`**

```typescript
import { createClient } from "@/lib/supabase/client";

import { type ClubRole } from "./types";

/** Role hierarchy: owner > admin > moderator > member */
const ROLE_HIERARCHY: Record<ClubRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

/**
 * Check if a user has the required role (or higher) in a club.
 * Returns the member's role if authorized, null otherwise.
 */
export async function checkClubPermission(
  userId: string,
  clubId: string,
  minimumRole: ClubRole,
): Promise<ClubRole | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  const memberRole = data.role as ClubRole;
  if (ROLE_HIERARCHY[memberRole] >= ROLE_HIERARCHY[minimumRole]) {
    return memberRole;
  }
  return null;
}

/**
 * Server-side permission check for API routes.
 * Uses the server Supabase client.
 */
export async function checkClubPermissionServer(
  userId: string,
  clubId: string,
  minimumRole: ClubRole,
): Promise<ClubRole | null> {
  // Dynamic import to avoid pulling server client into client bundles
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  const memberRole = data.role as ClubRole;
  if (ROLE_HIERARCHY[memberRole] >= ROLE_HIERARCHY[minimumRole]) {
    return memberRole;
  }
  return null;
}

/** Permission actions mapped to minimum required role */
export const CLUB_PERMISSIONS = {
  create_event: "admin" as ClubRole,
  edit_event: "moderator" as ClubRole,
  delete_event: "admin" as ClubRole,
  manage_bookings: "moderator" as ClubRole,
  invite_members: "admin" as ClubRole,
  remove_members: "admin" as ClubRole,
  edit_settings: "admin" as ClubRole,
  manage_payment: "owner" as ClubRole,
  delete_club: "owner" as ClubRole,
  promote_roles: "owner" as ClubRole,
  view_events: "member" as ClubRole,
} as const;
```

**Step 3: Update `src/lib/supabase/types.ts`**

Add the `clubs`, `club_members`, `club_invites` table types following existing patterns. Add `club_id` to the events Row/Insert/Update types. Update user role type from `"organizer" | "participant" | "guest"` to `"user" | "guest"`.

**Step 4: Write test for permissions**

Create: `src/lib/clubs/__tests__/permissions.test.ts`

```typescript
import { describe, expect, test } from "vitest";

import { CLUB_PERMISSIONS } from "../permissions";

describe("CLUB_PERMISSIONS", () => {
  test("create_event requires admin", () => {
    expect(CLUB_PERMISSIONS.create_event).toBe("admin");
  });

  test("edit_event requires moderator", () => {
    expect(CLUB_PERMISSIONS.edit_event).toBe("moderator");
  });

  test("delete_club requires owner", () => {
    expect(CLUB_PERMISSIONS.delete_club).toBe("owner");
  });

  test("manage_payment requires owner", () => {
    expect(CLUB_PERMISSIONS.manage_payment).toBe("owner");
  });

  test("view_events requires member", () => {
    expect(CLUB_PERMISSIONS.view_events).toBe("member");
  });
});
```

**Step 5: Run tests and commit**

```bash
pnpm test -- src/lib/clubs/__tests__/permissions.test.ts
git add src/lib/clubs/ src/lib/supabase/types.ts
git commit -m "feat: add club types, permission helper, and Supabase types"
```

---

## Task 3: Club API Routes (CRUD)

**Files:**

- Create: `src/app/(frontend)/api/clubs/route.ts` (GET list, POST create)
- Create: `src/app/(frontend)/api/clubs/[slug]/route.ts` (GET, PATCH, DELETE)

**Step 1: Implement `GET /api/clubs` and `POST /api/clubs`**

`src/app/(frontend)/api/clubs/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const activity = url.searchParams.get("activity");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "12", 10);
  const offset = (page - 1) * limit;

  let query = supabase.from("clubs").select("*, club_members(count)", { count: "exact" });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (activity) {
    query = query.contains("activity_types", [activity]);
  }

  // Only show public clubs (or clubs user is member of)
  query = query.eq("visibility", "public");

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ clubs: data, total: count, page, limit });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, logo_url, cover_url, activity_types, visibility, location } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Club name is required" }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  // Check slug uniqueness
  const { data: existing } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  // Create club
  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || null,
      logo_url: logo_url || null,
      cover_url: cover_url || null,
      activity_types: activity_types || [],
      visibility: visibility || "public",
      location: location?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add creator as owner
  await supabase.from("club_members").insert({
    club_id: club.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json(club, { status: 201 });
}
```

**Step 2: Implement `GET/PATCH/DELETE /api/clubs/[slug]`**

`src/app/(frontend)/api/clubs/[slug]/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club, error } = await supabase
    .from("clubs")
    .select("*, club_members(count)")
    .eq("slug", slug)
    .single();

  if (error || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Get event count
  const { count: eventCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  return NextResponse.json({ ...club, event_count: eventCount ?? 0 });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  const allowedFields = [
    "name",
    "description",
    "logo_url",
    "cover_url",
    "activity_types",
    "visibility",
    "location",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  // If name changes, update slug
  if (updates.name && typeof updates.name === "string") {
    const newSlug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
    updates.slug = newSlug;
  }

  // Payment info: owner only
  if (body.payment_info !== undefined) {
    const paymentRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.manage_payment,
    );
    if (!paymentRole) return NextResponse.json({ error: "Owner only" }, { status: 403 });
    updates.payment_info = body.payment_info;
  }

  const { data: updated, error } = await supabase
    .from("clubs")
    .update(updates)
    .eq("id", club.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.delete_club);
  if (!role) return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { error } = await supabase.from("clubs").delete().eq("id", club.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/
git commit -m "feat: add club CRUD API routes"
```

---

## Task 4: Club Members API

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/members/route.ts` (GET, POST)
- Create: `src/app/(frontend)/api/clubs/[slug]/members/[userId]/route.ts` (PATCH, DELETE)

**Step 1: Implement members list and join**

`src/app/(frontend)/api/clubs/[slug]/members/route.ts` — GET lists members with user data, POST handles joining (public clubs) or accepting invite (private clubs via `invite_code` in body).

**Step 2: Implement role change and removal**

`src/app/(frontend)/api/clubs/[slug]/members/[userId]/route.ts` — PATCH changes a member's role (owner only), DELETE removes a member (owner/admin) or allows self-leave (any member, except owner if they're the last owner).

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/members/
git commit -m "feat: add club member management API"
```

---

## Task 5: Club Invites API

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/invites/route.ts` (GET, POST, DELETE)
- Create: `src/app/(frontend)/api/invites/[code]/route.ts` (GET validate)

**Step 1: Implement invite CRUD**

`src/app/(frontend)/api/clubs/[slug]/invites/route.ts`:

- GET: List active invites for club (owner/admin only)
- POST: Create invite with optional `max_uses` and `expires_at` (owner/admin only). Generate random `invite_code` via `crypto.randomUUID().slice(0, 8)`.
- DELETE: Revoke invite by `id` in body (owner/admin only)

**Step 2: Implement invite validation**

`src/app/(frontend)/api/invites/[code]/route.ts`:

- GET: Look up invite by code, return club info if valid (not expired, under max uses)

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/invites/ src/app/(frontend)/api/invites/
git commit -m "feat: add club invite API routes"
```

---

## Task 6: Migrate Events API to club_id

The events API currently uses `organizer_profiles` and `organizer_id`. Update to use `clubs` and `club_id`.

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/participants/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/participants/[bookingId]/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/route-data/route.ts`
- Modify: `src/app/(frontend)/api/events/[id]/payments/route.ts`

**Step 1: Update `POST /api/events`**

Current flow: look up `organizer_profiles` by user_id, auto-create if missing, create event with `organizer_id`.

New flow:

1. Require `club_id` in request body
2. Call `checkClubPermissionServer(userId, clubId, "admin")` — must be owner or admin
3. Create event with `club_id` (and `organizer_id` for backward compat during migration)
4. Remove auto-create organizer profile logic
5. Remove `users.role = "organizer"` update

**Step 2: Update `GET /api/events`**

Replace `organizer_profiles` join with `clubs` join. Replace `organizer_id` filter with `club_id`. Update search to search club names.

**Step 3: Update `PATCH/DELETE /api/events/[id]`**

Replace ownership check: instead of `event.organizer_id === profile.id`, check `checkClubPermissionServer(userId, event.club_id, "moderator")` for edit, `"admin"` for delete.

**Step 4: Update participant and route-data routes**

Same pattern: replace organizer ownership checks with club permission checks.

**Step 5: Update payment route**

Replace organizer payment info lookup with club payment info lookup from `clubs.payment_info`.

**Step 6: Run typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/events/
git commit -m "refactor: migrate events API from organizer_id to club_id"
```

---

## Task 7: Update Auth Flows

Remove organizer-specific signup, update login redirects, simplify role handling.

**Files:**

- Modify: `src/app/(frontend)/(auth)/signup/page.tsx`
- Modify: `src/app/(frontend)/(auth)/login/page.tsx`
- Modify: `src/app/(frontend)/auth/callback/route.ts`
- Modify: `src/app/(frontend)/auth/strava/callback/route.ts`
- Remove: `src/app/(frontend)/api/claim/[token]/route.ts`

**Step 1: Update signup page**

- Remove `isOrganizerEntry` check and `?role=organizer` handling
- Remove organizer toggle checkbox and `orgName` state
- Remove post-signup organizer profile creation
- Remove `/dashboard` redirect for organizers
- All users sign up the same way. They create clubs later from `/clubs/new`.

**Step 2: Update login page**

- Remove `redirectByRole` function
- Everyone redirects to `/events` after login (or `returnTo` param)
- Remove `if (role === "organizer") router.push("/dashboard")`

**Step 3: Update auth callback**

- Remove organizer metadata handling
- Remove `organizer_profiles` upsert
- Remove role upgrade to "organizer"
- Set `role: "user"` for all new accounts (was "participant")

**Step 4: Update Strava callback**

- Remove organizer role redirect check

**Step 5: Remove claim token route**

Delete `src/app/(frontend)/api/claim/[token]/route.ts` — claim tokens are removed.

**Step 6: Commit**

```bash
git add src/app/(frontend)/(auth)/ src/app/(frontend)/auth/
git rm src/app/(frontend)/api/claim/[token]/route.ts
git commit -m "refactor: remove organizer signup flow, simplify auth to user/guest"
```

---

## Task 8: Dashboard Restructure

Replace the organizer dashboard with a club-based dashboard. Users see a personal overview page with all their clubs, then drill into per-club management.

**Files:**

- Modify: `src/app/(frontend)/(organizer)/dashboard/layout.tsx`
- Modify: `src/app/(frontend)/(organizer)/dashboard/page.tsx`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/layout.tsx`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/page.tsx`
- Move existing event management routes under `dashboard/clubs/[slug]/events/`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/members/page.tsx`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/settings/page.tsx`
- Create: `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/invites/page.tsx`
- Modify: `src/components/dashboard/DashboardSidebar.tsx`
- Create: `src/components/dashboard/ClubSwitcher.tsx`

**Step 1: Update dashboard layout auth guard**

Replace `role !== "organizer"` check with a query for `club_members` where user has `owner`, `admin`, or `moderator` role in at least one club. If no management memberships, redirect to `/events`.

```typescript
// New auth check
const { data: memberships } = await supabase
  .from("club_members")
  .select("club_id")
  .eq("user_id", user.id)
  .in("role", ["owner", "admin", "moderator"]);

if (!memberships?.length) redirect("/events");
```

**Step 2: Update dashboard overview page**

Show all clubs the user manages with stats (event count, member count, upcoming events). Each club card links to `/dashboard/clubs/[slug]`.

**Step 3: Create club-specific dashboard layout**

`dashboard/clubs/[slug]/layout.tsx` — Verify user has management role in this specific club. Render sidebar with: Overview, Events, Members, Settings, Invites.

**Step 4: Create club dashboard pages**

- `dashboard/clubs/[slug]/page.tsx` — Club overview (stats, recent events, recent members)
- `dashboard/clubs/[slug]/members/page.tsx` — Member list with role management
- `dashboard/clubs/[slug]/settings/page.tsx` — Club settings form (replaces `OrganizerProfileForm`)
- `dashboard/clubs/[slug]/invites/page.tsx` — Invite link management

**Step 5: Move event management routes**

Move existing event pages (list, new, [id], [id]/edit, [id]/checkin, [id]/print) from `dashboard/events/` to `dashboard/clubs/[slug]/events/`. Update queries to filter by `club_id`.

**Step 6: Create ClubSwitcher component**

Dropdown in the dashboard sidebar showing the user's clubs with management roles. Selecting a club navigates to `/dashboard/clubs/[slug]`.

**Step 7: Update DashboardSidebar**

Add ClubSwitcher at the top. Update links to be club-scoped.

**Step 8: Commit**

```bash
git add src/app/(frontend)/(organizer)/dashboard/ src/components/dashboard/
git commit -m "refactor: restructure dashboard around clubs"
```

---

## Task 9: Club Public Pages

Create the browse, profile, and join pages for clubs.

**Files:**

- Create: `src/app/(frontend)/(participant)/clubs/page.tsx`
- Create: `src/app/(frontend)/(participant)/clubs/loading.tsx`
- Create: `src/app/(frontend)/(participant)/clubs/[slug]/page.tsx`
- Create: `src/app/(frontend)/(participant)/clubs/[slug]/loading.tsx`
- Create: `src/app/(frontend)/(participant)/clubs/new/page.tsx`
- Create: `src/app/(frontend)/(participant)/clubs/join/[code]/page.tsx`
- Create: `src/components/clubs/ClubCard.tsx`
- Create: `src/components/clubs/ClubGrid.tsx`
- Create: `src/components/clubs/ClubProfileHeader.tsx`
- Create: `src/components/clubs/ClubMembersList.tsx`
- Create: `src/components/clubs/JoinClubButton.tsx`
- Create: `src/components/clubs/ClubRoleBadge.tsx`
- Create: `src/components/clubs/CreateClubForm.tsx`
- Create: `src/components/clubs/ClubSelector.tsx`

**Step 1: Build ClubCard and ClubGrid components**

`ClubCard`: Shows club logo, name, activity type icons, member count, and a join button (if public). Links to `/clubs/[slug]`.

`ClubGrid`: Renders a responsive grid of ClubCards with a search input and activity filter pills at the top.

**Step 2: Build `/clubs` browse page**

Server component that fetches clubs via Supabase and renders ClubGrid. Supports search params for filtering.

**Step 3: Build ClubProfileHeader and club detail page**

`ClubProfileHeader`: Cover image, logo overlay, club name, description, activity badges, member count, join/leave button.

`/clubs/[slug]` page: Tabs for Events (upcoming events belonging to this club) and Members (avatar grid with role badges). Reuse existing `EventCard` component for events list.

**Step 4: Build CreateClubForm and `/clubs/new` page**

Form with: name, description, logo upload (reuse existing upload component), activity type checkboxes, visibility toggle (public/private), location input.

On submit: POST to `/api/clubs`, redirect to `/clubs/[slug]`.

**Step 5: Build JoinClubButton**

States: "Join" (for public, not a member), "Pending" (for private, request sent), "Member" (already joined, shows leave option), "Manage" (for owner/admin/mod, links to dashboard).

**Step 6: Build invite join page**

`/clubs/join/[code]`: Validates invite code via `GET /api/invites/[code]`. Shows club info and "Join Club" button. On join: POST to `/api/clubs/[slug]/members` with `invite_code`.

**Step 7: Commit**

```bash
git add src/app/(frontend)/(participant)/clubs/ src/components/clubs/
git commit -m "feat: add club browse, profile, create, and join pages"
```

---

## Task 10: Navigation & Layout Updates

Update all navigation components to replace organizer references with club-aware logic.

**Files:**

- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/MobileNav.tsx`
- Modify: `src/components/layout/MobileDrawer.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/ClientShell.tsx`
- Modify: `src/components/landing/HostEventLink.tsx`

**Step 1: Update ClientShell**

Replace `role` state with `managedClubs` state (array of clubs where user has management role). Pass `hasClubRole` boolean instead of `role` to nav components for dashboard link visibility.

Or simpler approach: keep fetching `role` but add a `hasManagementRole` boolean derived from a `club_members` query. Pass both to nav components.

Actually, simplest approach: query `club_members` for the user and check if any row has `role IN ('owner', 'admin', 'moderator')`. Store as `canManage: boolean`.

**Step 2: Update Navbar**

Replace `role === "organizer"` → `canManage` for showing Dashboard link. Replace "Host Your Event" → "Create Club" link pointing to `/clubs/new`.

**Step 3: Update MobileNav**

Replace `role === "organizer"` → `canManage` for dashboard icon.

**Step 4: Update MobileDrawer**

Replace organizer links. Add "Clubs" link to `/clubs`. Replace "Sign up as organizer" with "Create a Club" → `/clubs/new`.

**Step 5: Update Footer**

Replace "Host Your Event" → "Start a Club" linking to `/clubs/new`.

**Step 6: Update HostEventLink**

Rename component or update to link to `/clubs/new`. Update text to "Start a Club" or "Create Event" depending on whether user has a club.

**Step 7: Commit**

```bash
git add src/components/layout/ src/components/landing/HostEventLink.tsx
git commit -m "refactor: update navigation from organizer to club-aware logic"
```

---

## Task 11: Update Event Components

Replace organizer references in event display components with club data.

**Files:**

- Modify: `src/components/events/EventCard.tsx` — show club name/logo instead of organizer
- Rename: `src/components/events/OrganizerCard.tsx` → `src/components/events/ClubCard.tsx` (or replace with the one from Task 9)
- Rename: `src/components/events/OrganizerLink.tsx` → `src/components/events/ClubLink.tsx`
- Modify: `src/components/events/EventsPageClient.tsx` — update filters
- Modify: `src/components/events/EventFilters.tsx` — rename organizer filter to club
- Modify: `src/components/events/EventsGrid.tsx`
- Modify: `src/components/events/EventsListClient.tsx`
- Modify: `src/components/dashboard/EventForm.tsx` — add ClubSelector, remove auto-org creation
- Modify: `src/components/booking/BookingForm.tsx` — club name instead of organizer
- Modify: `src/components/booking/BookingPageClient.tsx`
- Modify: `src/components/booking/BookingConfirmation.tsx`
- Modify: `src/components/booking/PaymentInstructions.tsx` — club payment info
- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx` — club info
- Modify: `src/app/(frontend)/(participant)/events/[id]/book/page.tsx` — club info
- Modify: `src/app/(frontend)/(participant)/events/page.tsx` — club filter
- Modify: `src/lib/events/map-event-card.ts` — map club data instead of organizer

**Step 1: Create ClubLink component**

Replace `OrganizerLink` — displays club name linking to `/clubs/[slug]`.

**Step 2: Update EventCard**

Replace organizer name + link with club name + club logo + link to `/clubs/[slug]`.

**Step 3: Update EventForm**

Add a `ClubSelector` dropdown at the top of the form. User picks which club the event belongs to. Remove organizer auto-creation logic.

**Step 4: Update booking components**

Replace organizer references with club name. Update payment instructions to pull from `clubs.payment_info`.

**Step 5: Update event detail and listing pages**

Replace organizer info sections with club info. Update Supabase queries to join `clubs` instead of `organizer_profiles`.

**Step 6: Update map-event-card helper**

Replace `organizer_profiles` mapping with `clubs` mapping.

**Step 7: Commit**

```bash
git add src/components/events/ src/components/booking/ src/components/dashboard/EventForm.tsx
git add src/app/(frontend)/(participant)/events/ src/lib/events/
git commit -m "refactor: replace organizer references with club in event components"
```

---

## Task 12: Update Reviews System

Rename organizer reviews to club reviews.

**Files:**

- Rename: `src/components/reviews/OrganizerReviewForm.tsx` → `src/components/reviews/ClubReviewForm.tsx`
- Rename: `src/components/reviews/OrganizerReviewSection.tsx` → `src/components/reviews/ClubReviewSection.tsx`
- Rename: `src/components/reviews/OrganizerReviewList.tsx` → `src/components/reviews/ClubReviewList.tsx`
- Rename: `src/components/reviews/OrganizerReviewCard.tsx` → `src/components/reviews/ClubReviewCard.tsx`
- Rename: `src/lib/types/organizer-reviews.ts` → `src/lib/types/club-reviews.ts`
- Rename: `src/app/(frontend)/api/organizers/[id]/reviews/route.ts` → `src/app/(frontend)/api/clubs/[slug]/reviews/route.ts`
- Modify: `src/lib/constants/review-tags.ts` — update if any organizer-specific tags
- Modify: `src/components/reviews/AuthReviewModal.tsx` — update API endpoint

**Step 1: Rename types and update interfaces**

Replace `organizer_id` with `club_id`, `OrganizerReviewWithUser` → `ClubReviewWithUser`.

**Step 2: Rename review components**

Update all internal references from organizer to club. Update API calls from `/api/organizers/[id]/reviews` to `/api/clubs/[slug]/reviews`.

**Step 3: Create club reviews API route**

Move and update the reviews API to use club slug lookup and `club_reviews` table.

**Step 4: Commit**

```bash
git add src/components/reviews/ src/lib/types/ src/app/(frontend)/api/clubs/[slug]/reviews/
git rm src/app/(frontend)/api/organizers/[id]/reviews/route.ts
git commit -m "refactor: rename organizer reviews to club reviews"
```

---

## Task 13: Update Landing Page

Replace organizer sections with club-focused content.

**Files:**

- Rename: `src/components/landing/OrganizersSection.tsx` → `src/components/landing/ClubsSection.tsx`
- Modify or remove: `src/components/landing/OrganizerWaitlistSection.tsx`
- Modify: `src/components/landing/HostEventLink.tsx`
- Modify: `src/components/landing/BentoEventsSection.tsx`
- Modify: `src/components/landing/BentoEventsClient.tsx`
- Modify: `src/components/landing/BentoEventCard.tsx`
- Modify: `src/components/landing/PioneerCounterSection.tsx`
- Modify: `src/components/landing/FAQSection.tsx`
- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Create ClubsSection**

Replace `OrganizersSection` — fetches clubs with member counts, renders club cards. Title: "Active Clubs" or "Community Clubs".

**Step 2: Remove OrganizerWaitlistSection**

Delete the waitlist section — clubs are open for anyone to create.

**Step 3: Update landing page**

Replace `<OrganizersSection>` with `<ClubsSection>`. Update any organizer references in headings/copy.

**Step 4: Update PioneerCounterSection**

Replace "Organizers" counter with "Clubs" counter (count from `clubs` table).

**Step 5: Update BentoEventCard**

Show club name instead of organizer name.

**Step 6: Commit**

```bash
git add src/components/landing/ src/app/(frontend)/page.tsx
git commit -m "refactor: update landing page from organizers to clubs"
```

---

## Task 14: Update Remaining References

Catch-all for remaining organizer references across the codebase.

**Files:**

- Modify: `src/app/(frontend)/(participant)/profile/page.tsx` — remove organizer redirect
- Remove: `src/app/(frontend)/(participant)/organizers/` — entire directory (replaced by `/clubs/[slug]`)
- Modify: `src/components/dashboard/PaymentSettingsForm.tsx` — use club context
- Modify: `src/components/dashboard/ReviewQRCode.tsx` — update for club reviews
- Remove: `src/components/dashboard/OrganizerProfileForm.tsx` — replaced by ClubSettingsForm
- Remove: `src/components/organizers/OrganizerProfileHeader.tsx` — replaced by ClubProfileHeader
- Remove: `src/components/organizers/OrganizerStats.tsx` — integrated into club profile
- Modify: `src/app/(frontend)/api/feed/route.ts` — remove `role === "organizer"` filter
- Modify: `src/app/(frontend)/api/chat/route.ts` — update organizer context references
- Modify: `src/app/(frontend)/api/badges/award/route.ts` — club permission check
- Modify: `src/app/(frontend)/api/bookings/[id]/verify/route.ts` — club permission check
- Modify: `src/app/(frontend)/api/checkins/route.ts` — club permission check
- Modify: `src/lib/organizers/resolve-profile.ts` — replace with club slug resolver or remove
- Modify: `src/lib/badges/award-event-badge.ts` — use club_id
- Modify: `src/lib/badges/check-pioneer-badges.ts` — update organizer references
- Modify: `src/lib/borders/check-borders.ts` — update organizer references
- Modify: `src/lib/ai/search-prompt.ts` — update context
- Modify: `src/lib/constants/system-badges.ts` — update organizer badge references
- Modify: `src/lib/constants/breadcrumb-routes.ts` — update organizer paths to club paths
- Modify: `src/lib/email/templates/review-request.ts` — update for clubs
- Modify: `src/app/sitemap.ts` — replace organizer URLs with club URLs
- Modify: `src/app/(frontend)/(participant)/post/[id]/page.tsx` — update organizer check
- Modify: `src/app/(frontend)/(participant)/about/page.tsx` — update organizer references

**Step 1: Update profile page**

Remove the organizer redirect logic. Show user's clubs list instead.

**Step 2: Remove organizer public pages**

Delete the entire `src/app/(frontend)/(participant)/organizers/` directory — replaced by `/clubs/[slug]`.

**Step 3: Remove old organizer components**

Delete `OrganizerProfileForm.tsx`, `OrganizerProfileHeader.tsx`, `OrganizerStats.tsx`.

**Step 4: Update API routes with permission checks**

Replace organizer_id ownership checks with `checkClubPermissionServer` calls in badges/award, bookings/verify, checkins, and any other API that checks event ownership.

**Step 5: Update utility functions**

- Replace `resolve-profile.ts` with a `resolveClub` that looks up by slug
- Update badge and border helpers to use `club_id`
- Update AI search prompt
- Update breadcrumb routes
- Update email templates

**Step 6: Update sitemap**

Replace `organizer_profiles` query with `clubs` query for generating club page URLs.

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove all remaining organizer references, update to clubs"
```

---

## Task 15: Update Admin Panel

Replace organizer management in admin with club management.

**Files:**

- Rename: `src/components/admin/OrganizerManager.tsx` → `src/components/admin/ClubManager.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Rename: `src/app/(admin)/admin/organizers/page.tsx` → `src/app/(admin)/admin/clubs/page.tsx`
- Rename: `src/app/(admin)/api/admin/organizers/` → `src/app/(admin)/api/admin/clubs/`
- Remove: `src/app/(admin)/api/admin/organizers/[id]/regenerate/route.ts` — no more claim tokens

**Step 1: Rename and update admin components**

Update `ClubManager` to list all clubs with member counts, owner info. Remove claim token generation (clubs are self-service now).

**Step 2: Update admin sidebar**

Replace "Organizers" link with "Clubs".

**Step 3: Commit**

```bash
git add src/components/admin/ src/app/(admin)/
git commit -m "refactor: update admin panel from organizers to clubs"
```

---

## Task 16: Update Seed Scripts

Update seed data to create clubs instead of organizer_profiles.

**Files:**

- Modify: `scripts/seed.ts`
- Modify: `scripts/unseed.ts`

**Step 1: Update seed.ts**

- Replace `ORGANIZER_PROFILES` with `CLUBS` data
- Replace user role `"organizer"` with `"user"` everywhere
- Create `club_members` entries (owners) instead of linking `organizer_profiles.user_id`
- Update event creation to use `club_id` instead of `organizer_id`

**Step 2: Update unseed.ts**

Replace `organizer_profiles` cleanup with `clubs`, `club_members`, `club_invites` cleanup.

**Step 3: Commit**

```bash
git add scripts/
git commit -m "refactor: update seed scripts for club architecture"
```

---

## Task 17: Typecheck, Lint, Test & Final Verification

**Step 1: Run full checks**

```bash
pnpm typecheck
pnpm lint
pnpm test
```

**Step 2: Fix any remaining issues**

Search for any remaining `organizer` references:

```bash
grep -r "organizer" src/ --include="*.ts" --include="*.tsx" -l
```

Fix any stragglers.

**Step 3: Run build**

```bash
pnpm build
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix remaining lint/type errors from club migration"
```

---

## Summary

| Task      | Description                    | Estimated Files |
| --------- | ------------------------------ | --------------- |
| 1         | Migration SQL                  | 1               |
| 2         | TypeScript types & permissions | 4               |
| 3         | Club CRUD API                  | 2               |
| 4         | Club members API               | 2               |
| 5         | Club invites API               | 2               |
| 6         | Migrate events API             | 6               |
| 7         | Update auth flows              | 5               |
| 8         | Dashboard restructure          | 12+             |
| 9         | Club public pages              | 14              |
| 10        | Navigation updates             | 6               |
| 11        | Event components               | 16              |
| 12        | Reviews system                 | 8               |
| 13        | Landing page                   | 9               |
| 14        | Remaining references           | 20+             |
| 15        | Admin panel                    | 5               |
| 16        | Seed scripts                   | 2               |
| 17        | Final verification             | 0               |
| **Total** |                                | **~115 files**  |
