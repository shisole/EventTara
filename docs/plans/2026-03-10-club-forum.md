# Club Forum Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an async club forum with threaded discussions, announcements, polls, and admin-defined categories — displayed as a tab on the club page.

**Architecture:** Dedicated Supabase tables (`club_forum_categories`, `club_forum_threads`, `club_forum_replies`, `club_forum_poll_votes`) with RLS. Forum tab on `/clubs/[slug]` page. Thread detail at `/clubs/[slug]/forum/[threadId]`. API routes follow existing `/api/clubs/[slug]/...` pattern. Notifications via existing `createNotifications` helper.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase, Tailwind CSS, pnpm

---

### Task 1: Database Types — Forum Tables

Add the four new forum table type definitions to the Supabase types file.

**Files:**

- Modify: `src/lib/supabase/types.ts:1529` (before the `};` that closes the Tables block)

**Step 1: Add `club_forum_categories` table types**

Insert before line 1530 (`};` closing Tables) in `src/lib/supabase/types.ts`:

```typescript
      club_forum_categories: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_threads: {
        Row: {
          id: string;
          club_id: string;
          category_id: string | null;
          user_id: string;
          title: string;
          body: string;
          type: "discussion" | "announcement" | "poll";
          poll_options: string[] | null;
          is_pinned: boolean;
          is_locked: boolean;
          reply_count: number;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          category_id?: string | null;
          user_id: string;
          title: string;
          body: string;
          type?: "discussion" | "announcement" | "poll";
          poll_options?: string[] | null;
          is_pinned?: boolean;
          is_locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          category_id?: string | null;
          user_id?: string;
          title?: string;
          body?: string;
          type?: "discussion" | "announcement" | "poll";
          poll_options?: string[] | null;
          is_pinned?: boolean;
          is_locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_replies: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      club_forum_poll_votes: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          option_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          option_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
```

**Step 2: Add notification types for forum**

In `src/lib/supabase/types.ts`, add `| "forum_reply" | "forum_mention"` to the notification type union in THREE places:

1. **Row type** (after line 887 `| "review_request";`):

   ```typescript
             | "forum_reply"
             | "forum_mention";
   ```

2. **Insert type** (after line 908 `| "review_request";`):

   ```typescript
             | "forum_reply"
             | "forum_mention";
   ```

3. **Update type** (after line 929 `| "review_request";`):
   ```typescript
             | "forum_reply"
             | "forum_mention";
   ```

**Step 3: Add notification icons**

In `src/components/notifications/NotificationItem.tsx`, add to the `TYPE_ICONS` record (after line 26):

```typescript
  forum_reply: "💬",
  forum_mention: "📣",
```

**Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (types are additive, nothing should break)

**Step 5: Commit**

```bash
git add src/lib/supabase/types.ts src/components/notifications/NotificationItem.tsx
git commit -m "feat(forum): add forum table types and notification types"
```

---

### Task 2: Forum Types and Permissions

Add TypeScript interfaces for forum entities and forum permissions.

**Files:**

- Modify: `src/lib/clubs/types.ts:54` (append after ClubMemberWithUser)
- Modify: `src/lib/clubs/permissions.ts:60` (add forum permissions to CLUB_PERMISSIONS)

**Step 1: Add forum TypeScript interfaces**

Append to the end of `src/lib/clubs/types.ts` (after line 53):

```typescript
export type ForumThreadType = "discussion" | "announcement" | "poll";

export interface ForumCategory {
  id: string;
  club_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface ForumThread {
  id: string;
  club_id: string;
  category_id: string | null;
  user_id: string;
  title: string;
  body: string;
  type: ForumThreadType;
  poll_options: string[] | null;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
}

export interface ForumThreadWithAuthor extends ForumThread {
  author: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  category: ForumCategory | null;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface ForumReplyWithAuthor extends ForumReply {
  author: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}
```

**Step 2: Add forum permissions**

In `src/lib/clubs/permissions.ts`, add these entries inside `CLUB_PERMISSIONS` (before the `} as const;` closing on line 61):

```typescript
  create_thread: "member" as ClubRole,
  create_announcement: "admin" as ClubRole,
  pin_thread: "admin" as ClubRole,
  lock_thread: "moderator" as ClubRole,
  delete_any_thread: "moderator" as ClubRole,
  delete_any_reply: "moderator" as ClubRole,
  manage_categories: "admin" as ClubRole,
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/clubs/types.ts src/lib/clubs/permissions.ts
git commit -m "feat(forum): add forum types and permissions"
```

---

### Task 3: SQL Migration — Create Forum Tables

Create the Supabase migration SQL for the four forum tables with RLS policies.

**Files:**

- Create: `supabase/migrations/20260310_club_forum.sql`

**Step 1: Write the migration SQL**

Create `supabase/migrations/20260310_club_forum.sql`:

```sql
-- Club Forum Categories
CREATE TABLE IF NOT EXISTS club_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, slug)
);

ALTER TABLE club_forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view categories"
  ON club_forum_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_categories.club_id
    AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Club admins can manage categories"
  ON club_forum_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_categories.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role IN ('owner', 'admin')
  ));

-- Club Forum Threads
CREATE TABLE IF NOT EXISTS club_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES club_forum_categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'discussion' CHECK (type IN ('discussion', 'announcement', 'poll')),
  poll_options JSONB,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  reply_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view threads"
  ON club_forum_threads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
    AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Club members can create threads"
  ON club_forum_threads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and moderators can update threads"
  ON club_forum_threads FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Authors and moderators can delete threads"
  ON club_forum_threads FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE INDEX idx_forum_threads_club_id ON club_forum_threads(club_id);
CREATE INDEX idx_forum_threads_category ON club_forum_threads(category_id);
CREATE INDEX idx_forum_threads_last_activity ON club_forum_threads(club_id, is_pinned DESC, last_activity_at DESC);

-- Club Forum Replies
CREATE TABLE IF NOT EXISTS club_forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES club_forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view replies"
  ON club_forum_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_forum_threads t
    JOIN club_members cm ON cm.club_id = t.club_id
    WHERE t.id = club_forum_replies.thread_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Club members can create replies on unlocked threads"
  ON club_forum_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_replies.thread_id
      AND cm.user_id = auth.uid()
      AND t.is_locked = false
    )
  );

CREATE POLICY "Authors and moderators can delete replies"
  ON club_forum_replies FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_replies.thread_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE INDEX idx_forum_replies_thread ON club_forum_replies(thread_id, created_at);

-- Club Forum Poll Votes
CREATE TABLE IF NOT EXISTS club_forum_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES club_forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE club_forum_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view poll votes"
  ON club_forum_poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_forum_threads t
    JOIN club_members cm ON cm.club_id = t.club_id
    WHERE t.id = club_forum_poll_votes.thread_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Club members can vote"
  ON club_forum_poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_poll_votes.thread_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can change their vote"
  ON club_forum_poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment reply count and update last_activity_at
CREATE OR REPLACE FUNCTION update_thread_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE club_forum_threads
    SET reply_count = reply_count + 1, last_activity_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE club_forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_thread_on_reply
AFTER INSERT OR DELETE ON club_forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_on_reply();
```

**Step 2: Run the migration in Supabase**

Run this SQL in the Supabase SQL editor (dashboard) for the project database.

**Step 3: Commit**

```bash
git add supabase/migrations/20260310_club_forum.sql
git commit -m "feat(forum): add forum tables migration with RLS"
```

---

### Task 4: Forum Categories API

Create the API route for managing forum categories (admin only).

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/categories/route.ts`

**Step 1: Implement GET + POST for categories**

Create `src/app/(frontend)/api/clubs/[slug]/forum/categories/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

async function getClubBySlug(slug: string) {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  return { supabase, club };
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const { supabase, club } = await getClubBySlug(slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify membership
  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: categories, error } = await supabase
    .from("club_forum_categories")
    .select("*")
    .eq("club_id", club.id)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const { supabase, club } = await getClubBySlug(slug);
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(
    user.id,
    club.id,
    CLUB_PERMISSIONS.manage_categories,
  );
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json({ error: "Name is required (1-50 chars)" }, { status: 400 });
  }

  const categorySlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Get next sort_order
  const { count } = await supabase
    .from("club_forum_categories")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  const { data: category, error } = await supabase
    .from("club_forum_categories")
    .insert({
      club_id: club.id,
      name,
      slug: categorySlug,
      sort_order: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category }, { status: 201 });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/categories/route.ts
git commit -m "feat(forum): add categories API (GET + POST)"
```

---

### Task 5: Forum Categories Delete API

Create the DELETE endpoint for removing a category.

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/categories/[categoryId]/route.ts`

**Step 1: Implement DELETE for categories**

Create `src/app/(frontend)/api/clubs/[slug]/forum/categories/[categoryId]/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; categoryId: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { slug, categoryId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(
    user.id,
    club.id,
    CLUB_PERMISSIONS.manage_categories,
  );
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("club_forum_categories")
    .delete()
    .eq("id", categoryId)
    .eq("club_id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/categories/[categoryId]/route.ts
git commit -m "feat(forum): add category DELETE endpoint"
```

---

### Task 6: Forum Threads API — List and Create

Create the main threads API route for listing and creating threads.

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/threads/route.ts`

**Step 1: Implement GET + POST for threads**

Create `src/app/(frontend)/api/clubs/[slug]/forum/threads/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { type ForumThreadType } from "@/lib/clubs/types";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("club_forum_threads")
    .select(
      "*, users!club_forum_threads_user_id_fkey(id, full_name, username, avatar_url), club_forum_categories(id, name, slug)",
      { count: "exact" },
    )
    .eq("club_id", club.id)
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    // Look up category by slug first
    const { data: cat } = await supabase
      .from("club_forum_categories")
      .select("id")
      .eq("club_id", club.id)
      .eq("slug", categorySlug)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  const { data: threads, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to clean shape
  const mapped = (threads ?? []).map((t: any) => ({
    id: t.id,
    club_id: t.club_id,
    category_id: t.category_id,
    user_id: t.user_id,
    title: t.title,
    body: t.body,
    type: t.type,
    poll_options: t.poll_options,
    is_pinned: t.is_pinned,
    is_locked: t.is_locked,
    reply_count: t.reply_count,
    last_activity_at: t.last_activity_at,
    created_at: t.created_at,
    author: Array.isArray(t.users) ? t.users[0] : t.users,
    category: Array.isArray(t.club_forum_categories)
      ? t.club_forum_categories[0]
      : t.club_forum_categories,
  }));

  return NextResponse.json({
    threads: mapped,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.create_thread);
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    type?: ForumThreadType;
    category_id?: string | null;
    poll_options?: string[];
  };

  const title = body.title?.trim();
  const threadBody = body.body?.trim() ?? "";
  const type: ForumThreadType = body.type ?? "discussion";

  if (!title || title.length < 1 || title.length > 200) {
    return NextResponse.json({ error: "Title is required (1-200 chars)" }, { status: 400 });
  }

  // Only admins+ can create announcements
  if (type === "announcement") {
    const adminRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.create_announcement,
    );
    if (!adminRole) {
      return NextResponse.json({ error: "Only admins can create announcements" }, { status: 403 });
    }
  }

  // Validate poll options
  let pollOptions: string[] | null = null;
  if (type === "poll") {
    if (!body.poll_options || body.poll_options.length < 2 || body.poll_options.length > 10) {
      return NextResponse.json({ error: "Polls require 2-10 options" }, { status: 400 });
    }
    pollOptions = body.poll_options.map((o) => o.trim()).filter(Boolean);
    if (pollOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 non-empty options required" }, { status: 400 });
    }
  }

  const { data: thread, error } = await supabase
    .from("club_forum_threads")
    .insert({
      club_id: club.id,
      user_id: user.id,
      title,
      body: threadBody,
      type,
      category_id: body.category_id ?? null,
      poll_options: pollOptions,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get author name for notification
  const { data: authorProfile } = await supabase
    .from("users")
    .select("full_name, username")
    .eq("id", user.id)
    .single();
  const authorName = authorProfile?.full_name ?? authorProfile?.username ?? "Someone";

  // Notify other club members about announcements only (don't spam for every discussion)
  if (type === "announcement") {
    const { data: members } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", club.id)
      .neq("user_id", user.id);

    if (members && members.length > 0) {
      void createNotifications(
        supabase,
        members.map((m) => ({
          userId: m.user_id,
          type: "forum_reply" as const,
          title: `New announcement in ${club.name}`,
          body: `${authorName}: ${title}`,
          href: `/clubs/${club.slug}/forum/${thread.id}`,
          actorId: user.id,
        })),
      );
    }
  }

  return NextResponse.json({ thread }, { status: 201 });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/threads/route.ts
git commit -m "feat(forum): add threads API (GET list + POST create)"
```

---

### Task 7: Forum Thread Detail API — Get, Update, Delete

Create the single-thread API for fetching, updating (edit/pin/lock), and deleting.

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/route.ts`

**Step 1: Implement GET + PATCH + DELETE**

Create `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; threadId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: thread, error } = await supabase
    .from("club_forum_threads")
    .select(
      "*, users!club_forum_threads_user_id_fkey(id, full_name, username, avatar_url), club_forum_categories(id, name, slug)",
    )
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();

  if (error || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Fetch poll votes if it's a poll
  let pollVotes: { option_index: number; count: number }[] = [];
  let userVote: number | null = null;

  if (thread.type === "poll") {
    const { data: votes } = await supabase
      .from("club_forum_poll_votes")
      .select("option_index, user_id")
      .eq("thread_id", threadId);

    if (votes) {
      const counts: Record<number, number> = {};
      for (const v of votes) {
        counts[v.option_index] = (counts[v.option_index] ?? 0) + 1;
        if (v.user_id === user.id) userVote = v.option_index;
      }
      pollVotes = Object.entries(counts).map(([idx, count]) => ({
        option_index: Number(idx),
        count,
      }));
    }
  }

  const mapped = {
    id: thread.id,
    club_id: thread.club_id,
    category_id: thread.category_id,
    user_id: thread.user_id,
    title: thread.title,
    body: thread.body,
    type: thread.type,
    poll_options: thread.poll_options,
    is_pinned: thread.is_pinned,
    is_locked: thread.is_locked,
    reply_count: thread.reply_count,
    last_activity_at: thread.last_activity_at,
    created_at: thread.created_at,
    author: Array.isArray(thread.users) ? thread.users[0] : thread.users,
    category: Array.isArray(thread.club_forum_categories)
      ? thread.club_forum_categories[0]
      : thread.club_forum_categories,
    poll_votes: pollVotes,
    user_vote: userVote,
  };

  return NextResponse.json({ thread: mapped });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("user_id")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
  };

  const updates: Record<string, unknown> = {};

  // Edit title/body — author or moderator+
  if (body.title !== undefined || body.body !== undefined) {
    const isAuthor = thread.user_id === user.id;
    if (!isAuthor) {
      const modRole = await checkClubPermissionServer(
        user.id,
        club.id,
        CLUB_PERMISSIONS.delete_any_thread,
      );
      if (!modRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.body !== undefined) updates.body = body.body.trim();
  }

  // Pin — admin+ only
  if (body.is_pinned !== undefined) {
    const pinRole = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.pin_thread);
    if (!pinRole) return NextResponse.json({ error: "Only admins can pin" }, { status: 403 });
    updates.is_pinned = body.is_pinned;
  }

  // Lock — moderator+ only
  if (body.is_locked !== undefined) {
    const lockRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.lock_thread,
    );
    if (!lockRole) return NextResponse.json({ error: "Only moderators can lock" }, { status: 403 });
    updates.is_locked = body.is_locked;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("club_forum_threads")
    .update(updates)
    .eq("id", threadId)
    .eq("club_id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("user_id")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  // Author can delete their own, moderator+ can delete any
  const isAuthor = thread.user_id === user.id;
  if (!isAuthor) {
    const modRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.delete_any_thread,
    );
    if (!modRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("club_forum_threads").delete().eq("id", threadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/route.ts
git commit -m "feat(forum): add thread detail API (GET + PATCH + DELETE)"
```

---

### Task 8: Forum Replies API

Create the replies endpoints (list, create, delete) and poll voting.

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/replies/route.ts`
- Create: `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/vote/route.ts`

**Step 1: Implement replies GET + POST**

Create `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/replies/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer } from "@/lib/clubs/permissions";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; threadId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: replies, error } = await supabase
    .from("club_forum_replies")
    .select("*, users!club_forum_replies_user_id_fkey(id, full_name, username, avatar_url)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (replies ?? []).map((r: any) => ({
    id: r.id,
    thread_id: r.thread_id,
    user_id: r.user_id,
    text: r.text,
    created_at: r.created_at,
    author: Array.isArray(r.users) ? r.users[0] : r.users,
  }));

  return NextResponse.json({ replies: mapped });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Check thread exists and is not locked
  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("id, user_id, title, is_locked")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (thread.is_locked) {
    return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
  }

  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text || text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: "Text is required (1-2000 chars)" }, { status: 400 });
  }

  const { data: reply, error } = await supabase
    .from("club_forum_replies")
    .insert({ thread_id: threadId, user_id: user.id, text })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get author name
  const { data: authorProfile } = await supabase
    .from("users")
    .select("full_name, username")
    .eq("id", user.id)
    .single();
  const authorName = authorProfile?.full_name ?? authorProfile?.username ?? "Someone";

  // Notify thread author
  if (thread.user_id !== user.id) {
    void createNotifications(supabase, [
      {
        userId: thread.user_id,
        type: "forum_reply",
        title: `New reply on "${thread.title}"`,
        body: `${authorName}: ${text.slice(0, 100)}`,
        href: `/clubs/${club.slug}/forum/${threadId}`,
        actorId: user.id,
      },
    ]);
  }

  // Handle @mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = [...text.matchAll(mentionRegex)].map((m) => m[1]);
  if (mentions.length > 0) {
    const { data: mentionedUsers } = await supabase
      .from("users")
      .select("id, username")
      .in("username", mentions);

    if (mentionedUsers && mentionedUsers.length > 0) {
      void createNotifications(
        supabase,
        mentionedUsers
          .filter((u) => u.id !== user.id && u.id !== thread.user_id)
          .map((u) => ({
            userId: u.id,
            type: "forum_mention" as const,
            title: `${authorName} mentioned you`,
            body: `In "${thread.title}": ${text.slice(0, 100)}`,
            href: `/clubs/${club.slug}/forum/${threadId}`,
            actorId: user.id,
          })),
      );
    }
  }

  // Re-fetch with author for response
  const replyWithAuthor = {
    ...reply,
    author: {
      id: user.id,
      full_name: authorProfile?.full_name ?? null,
      username: authorProfile?.username ?? null,
      avatar_url: null,
    },
  };

  return NextResponse.json({ reply: replyWithAuthor }, { status: 201 });
}
```

**Step 2: Implement poll vote endpoint**

Create `src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/vote/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; threadId: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("id, type, poll_options")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (!thread || thread.type !== "poll") {
    return NextResponse.json({ error: "Not a poll thread" }, { status: 400 });
  }

  const body = (await req.json()) as { option_index?: number };
  const optionIndex = body.option_index;
  const options = (thread.poll_options ?? []) as string[];

  if (optionIndex === undefined || optionIndex < 0 || optionIndex >= options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  // Upsert: delete existing vote then insert
  await supabase
    .from("club_forum_poll_votes")
    .delete()
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("club_forum_poll_votes")
    .insert({ thread_id: threadId, user_id: user.id, option_index: optionIndex });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, option_index: optionIndex });
}
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/replies/route.ts \
  src/app/(frontend)/api/clubs/[slug]/forum/threads/[threadId]/vote/route.ts
git commit -m "feat(forum): add replies API and poll voting"
```

---

### Task 9: Forum Reply Delete API

Create the delete endpoint for individual replies.

**Files:**

- Create: `src/app/(frontend)/api/clubs/[slug]/forum/replies/[replyId]/route.ts`

**Step 1: Implement DELETE**

Create `src/app/(frontend)/api/clubs/[slug]/forum/replies/[replyId]/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; replyId: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { slug, replyId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch reply to check ownership
  const { data: reply } = await supabase
    .from("club_forum_replies")
    .select("id, user_id, thread_id")
    .eq("id", replyId)
    .single();
  if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  // Verify the reply belongs to a thread in this club
  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("club_id")
    .eq("id", reply.thread_id)
    .single();
  if (!thread || thread.club_id !== club.id) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }

  // Author can delete own, moderator+ can delete any
  const isAuthor = reply.user_id === user.id;
  if (!isAuthor) {
    const modRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.delete_any_reply,
    );
    if (!modRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("club_forum_replies").delete().eq("id", replyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add src/app/(frontend)/api/clubs/[slug]/forum/replies/[replyId]/route.ts
git commit -m "feat(forum): add reply DELETE endpoint"
```

---

### Task 10: Club Page Tab UI — Refactor to Tabs

Refactor the club page from stacked sections to a tabbed layout with Events, Forum, and Members tabs.

**Files:**

- Create: `src/components/clubs/ClubTabs.tsx`
- Modify: `src/app/(frontend)/(participant)/clubs/[slug]/page.tsx`

**Step 1: Create the ClubTabs client component**

Create `src/components/clubs/ClubTabs.tsx`:

```tsx
"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface ClubTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: Record<string, ReactNode>;
}

export default function ClubTabs({ tabs, defaultTab, children }: ClubTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-teal-600 dark:text-teal-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">({tab.count})</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {children[activeTab]}
    </div>
  );
}
```

**Step 2: Update the club page to use tabs**

Replace the Events and Members sections in `src/app/(frontend)/(participant)/clubs/[slug]/page.tsx` (lines 143–212) with a tab-based layout. The page needs to import `ClubTabs` and pass the Events section, a Forum placeholder, and Members section as tab content.

Replace lines 143–212 with:

```tsx
{
  /* Tabs */
}
<ClubTabs
  tabs={[
    { id: "events", label: "Events", count: eventCount ?? 0 },
    { id: "forum", label: "Forum" },
    { id: "members", label: "Members", count: memberCount ?? 0 },
  ]}
>
  {{
    events: (
      <section>
        {eventCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventCards.map((event) => (
              <EventCard key={event.id} {...event} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <svg
              className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No events yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              This club hasn&apos;t created any events
            </p>
          </div>
        )}
      </section>
    ),
    forum: currentMembership ? (
      <ForumTab clubId={club.id} clubSlug={club.slug} userRole={currentMembership.role} />
    ) : (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Join this club to access the forum
        </p>
      </div>
    ),
    members: (
      <section>
        {sortedMembers.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedMembers.map((member) => {
                const userData = Array.isArray(member.users) ? member.users[0] : member.users;
                const displayName = userData?.full_name || userData?.username || "Unknown";

                return (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center gap-1.5 py-2"
                  >
                    <Avatar src={userData?.avatar_url ?? null} alt={displayName} size="md" />
                    <div className="min-w-0 w-full">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {member.role !== "member" && (
                        <ClubRoleBadge role={member.role as ClubRole} className="mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <p className="text-gray-500 dark:text-gray-400">No members yet</p>
          </div>
        )}
      </section>
    ),
  }}
</ClubTabs>;
```

Also add the imports at the top of the file:

```typescript
import ClubTabs from "@/components/clubs/ClubTabs";
import ForumTab from "@/components/clubs/forum/ForumTab";
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: Will fail — `ForumTab` doesn't exist yet. That's expected, we'll create it in the next task.

**Step 4: Commit**

```bash
git add src/components/clubs/ClubTabs.tsx src/app/(frontend)/(participant)/clubs/[slug]/page.tsx
git commit -m "feat(forum): add tab UI to club page"
```

---

### Task 11: ForumTab Component — Thread List with Category Filter

Create the main forum tab component that shows the thread list with category filtering.

**Files:**

- Create: `src/components/clubs/forum/ForumTab.tsx`
- Create: `src/components/clubs/forum/ForumThreadCard.tsx`

**Step 1: Create ForumThreadCard**

Create `src/components/clubs/forum/ForumThreadCard.tsx`:

```tsx
"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui";
import { type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface ForumThreadCardProps {
  thread: ForumThreadWithAuthor;
  clubSlug: string;
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  poll: {
    label: "Poll",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  },
};

export default function ForumThreadCard({ thread, clubSlug }: ForumThreadCardProps) {
  const typeBadge = TYPE_BADGES[thread.type];
  const authorName = thread.author?.full_name ?? thread.author?.username ?? "Unknown";

  return (
    <Link
      href={`/clubs/${clubSlug}/forum/${thread.id}`}
      className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <Avatar src={thread.author?.avatar_url ?? null} alt={authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && (
            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Pinned</span>
          )}
          {typeBadge && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge.className}`}
            >
              {typeBadge.label}
            </span>
          )}
          {thread.category && (
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {thread.category.name}
            </span>
          )}
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white text-sm mt-0.5 line-clamp-1">
          {thread.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{authorName}</span>
          <span>&middot;</span>
          <span>{formatRelativeTime(thread.last_activity_at)}</span>
          <span>&middot;</span>
          <span>
            {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
          </span>
          {thread.is_locked && (
            <>
              <span>&middot;</span>
              <span className="text-gray-400">Locked</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Create ForumTab**

Create `src/components/clubs/forum/ForumTab.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

import { type ClubRole, type ForumCategory, type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

import ForumNewThreadForm from "./ForumNewThreadForm";
import ForumThreadCard from "./ForumThreadCard";

interface ForumTabProps {
  clubId: string;
  clubSlug: string;
  userRole: ClubRole;
}

export default function ForumTab({ clubId, clubSlug, userRole }: ForumTabProps) {
  const [threads, setThreads] = useState<ForumThreadWithAuthor[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (activeCategory) params.set("category", activeCategory);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads?${params.toString()}`);
    if (res.ok) {
      const data = (await res.json()) as {
        threads: ForumThreadWithAuthor[];
        totalPages: number;
      };
      setThreads(data.threads);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [clubSlug, page, activeCategory]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`);
    if (res.ok) {
      const data = (await res.json()) as { categories: ForumCategory[] };
      setCategories(data.categories);
    }
  }, [clubSlug]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  const handleThreadCreated = () => {
    setShowNewThread(false);
    setPage(1);
    void fetchThreads();
  };

  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="space-y-4">
      {/* Category filter + New Thread button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              setActiveCategory(null);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              !activeCategory
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.slug);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.slug
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewThread(true)}
          className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Thread
        </button>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <ForumNewThreadForm
          clubSlug={clubSlug}
          categories={categories}
          isAdmin={isAdmin}
          onCreated={handleThreadCreated}
          onCancel={() => setShowNewThread(false)}
        />
      )}

      {/* Thread list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            Loading threads...
          </div>
        ) : threads.length > 0 ? (
          threads.map((thread) => (
            <ForumThreadCard key={thread.id} thread={thread} clubSlug={clubSlug} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No threads yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start a conversation!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: Will fail — `ForumNewThreadForm` doesn't exist yet. That's OK; it's created in the next task.

**Step 4: Commit**

```bash
git add src/components/clubs/forum/ForumTab.tsx src/components/clubs/forum/ForumThreadCard.tsx
git commit -m "feat(forum): add ForumTab and ForumThreadCard components"
```

---

### Task 12: New Thread Form Component

Create the form for creating new threads with type selection (discussion/announcement/poll).

**Files:**

- Create: `src/components/clubs/forum/ForumNewThreadForm.tsx`

**Step 1: Create the form component**

Create `src/components/clubs/forum/ForumNewThreadForm.tsx`:

```tsx
"use client";

import { useState } from "react";

import { type ForumCategory, type ForumThreadType } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

interface ForumNewThreadFormProps {
  clubSlug: string;
  categories: ForumCategory[];
  isAdmin: boolean;
  onCreated: () => void;
  onCancel: () => void;
}

export default function ForumNewThreadForm({
  clubSlug,
  categories,
  isAdmin,
  onCreated,
  onCancel,
}: ForumNewThreadFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<ForumThreadType>("discussion");
  const [categoryId, setCategoryId] = useState<string>("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      body: body.trim(),
      type,
      category_id: categoryId || null,
    };

    if (type === "poll") {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Polls require at least 2 options");
        setSubmitting(false);
        return;
      }
      payload.poll_options = validOptions;
    }

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onCreated();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to create thread");
    }
    setSubmitting(false);
  };

  const threadTypes: { value: ForumThreadType; label: string; adminOnly?: boolean }[] = [
    { value: "discussion", label: "Discussion" },
    { value: "announcement", label: "Announcement", adminOnly: true },
    { value: "poll", label: "Poll" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4"
    >
      <h3 className="font-heading font-semibold text-gray-900 dark:text-white">New Thread</h3>

      {/* Type selector */}
      <div className="flex gap-2">
        {threadTypes
          .filter((t) => !t.adminOnly || isAdmin)
          .map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                type === t.value
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        required
      />

      {/* Category */}
      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      {/* Body */}
      <textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
      />

      {/* Poll options */}
      {type === "poll" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Poll Options</p>
          {pollOptions.map((option, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={option}
                onChange={(e) => handlePollOptionChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemovePollOption(i)}
                  className="text-gray-400 hover:text-red-500 text-sm px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 10 && (
            <button
              type="button"
              onClick={handleAddPollOption}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? "Creating..." : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (ForumTab now has ForumNewThreadForm available)

**Step 3: Commit**

```bash
git add src/components/clubs/forum/ForumNewThreadForm.tsx
git commit -m "feat(forum): add new thread form with poll support"
```

---

### Task 13: Thread Detail Page

Create the thread detail page with replies, poll widget, and admin controls.

**Files:**

- Create: `src/app/(frontend)/(participant)/clubs/[slug]/forum/[threadId]/page.tsx`
- Create: `src/components/clubs/forum/ForumThreadDetail.tsx`
- Create: `src/components/clubs/forum/ForumPollWidget.tsx`
- Create: `src/components/clubs/forum/ForumReplySection.tsx`
- Create: `src/components/clubs/forum/ForumAdminControls.tsx`

**Step 1: Create the server page**

Create `src/app/(frontend)/(participant)/clubs/[slug]/forum/[threadId]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import ForumThreadDetail from "@/components/clubs/forum/ForumThreadDetail";
import { type ClubRole } from "@/lib/clubs/types";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}): Promise<Metadata> {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("title")
    .eq("id", threadId)
    .single();

  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();

  return {
    title: thread ? `${thread.title} — ${club?.name ?? "Club"} Forum` : "Thread Not Found",
  };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/clubs/${slug}/forum/${threadId}`);
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  // Verify membership
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <ForumThreadDetail
        clubSlug={club.slug}
        clubName={club.name}
        threadId={threadId}
        userId={user.id}
        userRole={membership.role as ClubRole}
      />
    </div>
  );
}
```

**Step 2: Create ForumPollWidget**

Create `src/components/clubs/forum/ForumPollWidget.tsx`:

```tsx
"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface PollVote {
  option_index: number;
  count: number;
}

interface ForumPollWidgetProps {
  clubSlug: string;
  threadId: string;
  options: string[];
  votes: PollVote[];
  userVote: number | null;
}

export default function ForumPollWidget({
  clubSlug,
  threadId,
  options,
  votes,
  userVote: initialUserVote,
}: ForumPollWidgetProps) {
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [pollVotes, setPollVotes] = useState<PollVote[]>(votes);
  const [voting, setVoting] = useState(false);

  const totalVotes = pollVotes.reduce((sum, v) => sum + v.count, 0);
  const hasVoted = userVote !== null;

  const getVoteCount = (index: number) =>
    pollVotes.find((v) => v.option_index === index)?.count ?? 0;

  const handleVote = async (optionIndex: number) => {
    setVoting(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_index: optionIndex }),
    });

    if (res.ok) {
      // Update local state
      const newVotes = [...pollVotes];
      // Remove old vote if exists
      if (userVote !== null) {
        const oldIdx = newVotes.findIndex((v) => v.option_index === userVote);
        if (oldIdx >= 0) {
          newVotes[oldIdx] = {
            ...newVotes[oldIdx],
            count: Math.max(0, newVotes[oldIdx].count - 1),
          };
        }
      }
      // Add new vote
      const newIdx = newVotes.findIndex((v) => v.option_index === optionIndex);
      if (newIdx >= 0) {
        newVotes[newIdx] = { ...newVotes[newIdx], count: newVotes[newIdx].count + 1 };
      } else {
        newVotes.push({ option_index: optionIndex, count: 1 });
      }
      setPollVotes(newVotes);
      setUserVote(optionIndex);
    }
    setVoting(false);
  };

  return (
    <div className="space-y-2 my-4">
      {options.map((option, i) => {
        const count = getVoteCount(i);
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = userVote === i;

        return (
          <button
            key={i}
            onClick={() => handleVote(i)}
            disabled={voting}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors relative overflow-hidden",
              isSelected
                ? "border-teal-500 dark:border-teal-600"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
            )}
          >
            {hasVoted && (
              <div
                className="absolute inset-y-0 left-0 bg-teal-50 dark:bg-teal-950/20 transition-all"
                style={{ width: `${String(pct)}%` }}
              />
            )}
            <div className="relative flex justify-between items-center">
              <span className={cn("font-medium", isSelected && "text-teal-700 dark:text-teal-300")}>
                {option}
              </span>
              {hasVoted && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {pct}% ({count})
                </span>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
```

**Step 3: Create ForumAdminControls**

Create `src/components/clubs/forum/ForumAdminControls.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { type ClubRole } from "@/lib/clubs/types";

interface ForumAdminControlsProps {
  clubSlug: string;
  threadId: string;
  isPinned: boolean;
  isLocked: boolean;
  isAuthor: boolean;
  userRole: ClubRole;
}

export default function ForumAdminControls({
  clubSlug,
  threadId,
  isPinned,
  isLocked,
  isAuthor,
  userRole,
}: ForumAdminControlsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const isAdmin = userRole === "owner" || userRole === "admin";
  const isMod = isAdmin || userRole === "moderator";
  const canDelete = isAuthor || isMod;

  const handlePatch = async (updates: Record<string, unknown>) => {
    setUpdating(true);
    await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setUpdating(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!globalThis.confirm("Delete this thread? This cannot be undone.")) return;
    setUpdating(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(`/clubs/${clubSlug}`);
    }
    setUpdating(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isAdmin && (
        <button
          onClick={() => handlePatch({ is_pinned: !isPinned })}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>
      )}
      {isMod && (
        <button
          onClick={() => handlePatch({ is_locked: !isLocked })}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {isLocked ? "Unlock" : "Lock"}
        </button>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
```

**Step 4: Create ForumReplySection**

Create `src/components/clubs/forum/ForumReplySection.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/ui";
import { type ForumReplyWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface ForumReplySectionProps {
  clubSlug: string;
  threadId: string;
  isLocked: boolean;
  userId: string;
  isModerator: boolean;
}

export default function ForumReplySection({
  clubSlug,
  threadId,
  isLocked,
  userId,
  isModerator,
}: ForumReplySectionProps) {
  const [replies, setReplies] = useState<ForumReplyWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/replies`);
    if (res.ok) {
      const data = (await res.json()) as { replies: ForumReplyWithAuthor[] };
      setReplies(data.replies);
    }
    setLoading(false);
  }, [clubSlug, threadId]);

  useEffect(() => {
    void fetchReplies();
  }, [fetchReplies]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: replyText.trim() }),
    });

    if (res.ok) {
      const data = (await res.json()) as { reply: ForumReplyWithAuthor };
      setReplies((prev) => [...prev, data.reply]);
      setReplyText("");
    }
    setSubmitting(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!globalThis.confirm("Delete this reply?")) return;
    const res = await fetch(`/api/clubs/${clubSlug}/forum/replies/${replyId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-gray-900 dark:text-white">
        Replies ({replies.length})
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading replies...</p>
      ) : replies.length > 0 ? (
        <div className="space-y-3">
          {replies.map((reply) => {
            const authorName = reply.author?.full_name ?? reply.author?.username ?? "Unknown";
            const canDelete = reply.user_id === userId || isModerator;

            return (
              <div
                key={reply.id}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <Avatar src={reply.author?.avatar_url ?? null} alt={authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {authorName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                    {reply.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No replies yet. Be the first to respond!
        </p>
      )}

      {/* Reply composer */}
      {!isLocked ? (
        <form onSubmit={handleSubmitReply} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a reply... (use @username to mention)"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={2000}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reply
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
          This thread is locked. No new replies.
        </p>
      )}
    </div>
  );
}
```

**Step 5: Create ForumThreadDetail**

Create `src/components/clubs/forum/ForumThreadDetail.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/ui";
import { type ClubRole, type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

import ForumAdminControls from "./ForumAdminControls";
import ForumPollWidget from "./ForumPollWidget";
import ForumReplySection from "./ForumReplySection";

interface PollVote {
  option_index: number;
  count: number;
}

interface ForumThreadDetailProps {
  clubSlug: string;
  clubName: string;
  threadId: string;
  userId: string;
  userRole: ClubRole;
}

export default function ForumThreadDetail({
  clubSlug,
  clubName,
  threadId,
  userId,
  userRole,
}: ForumThreadDetailProps) {
  const [thread, setThread] = useState<
    (ForumThreadWithAuthor & { poll_votes: PollVote[]; user_vote: number | null }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`);
    if (res.ok) {
      const data = (await res.json()) as {
        thread: ForumThreadWithAuthor & { poll_votes: PollVote[]; user_vote: number | null };
      };
      setThread(data.thread);
    }
    setLoading(false);
  }, [clubSlug, threadId]);

  useEffect(() => {
    void fetchThread();
  }, [fetchThread]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading thread...</div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Thread not found</p>
        <Link
          href={`/clubs/${clubSlug}`}
          className="text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2 inline-block"
        >
          Back to club
        </Link>
      </div>
    );
  }

  const authorName = thread.author?.full_name ?? thread.author?.username ?? "Unknown";
  const isAuthor = thread.user_id === userId;
  const isMod = userRole === "owner" || userRole === "admin" || userRole === "moderator";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/clubs/${clubSlug}`}
        className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
      >
        &larr; {clubName} Forum
      </Link>

      {/* Thread header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && (
            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Pinned</span>
          )}
          {thread.type === "announcement" && (
            <span className="inline-block rounded-full bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              Announcement
            </span>
          )}
          {thread.type === "poll" && (
            <span className="inline-block rounded-full bg-purple-50 dark:bg-purple-950/30 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
              Poll
            </span>
          )}
          {thread.category && (
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {thread.category.name}
            </span>
          )}
          {thread.is_locked && <span className="text-xs text-gray-400">Locked</span>}
        </div>

        {/* Title */}
        <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
          {thread.title}
        </h1>

        {/* Author + time */}
        <div className="flex items-center gap-3">
          <Avatar src={thread.author?.avatar_url ?? null} alt={authorName} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(thread.created_at)}
            </p>
          </div>
        </div>

        {/* Admin controls */}
        {(isAuthor || isMod) && (
          <ForumAdminControls
            clubSlug={clubSlug}
            threadId={thread.id}
            isPinned={thread.is_pinned}
            isLocked={thread.is_locked}
            isAuthor={isAuthor}
            userRole={userRole}
          />
        )}

        {/* Body */}
        {thread.body && (
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {thread.body}
          </div>
        )}

        {/* Poll */}
        {thread.type === "poll" && thread.poll_options && (
          <ForumPollWidget
            clubSlug={clubSlug}
            threadId={thread.id}
            options={thread.poll_options}
            votes={thread.poll_votes}
            userVote={thread.user_vote}
          />
        )}
      </div>

      {/* Replies */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
        <ForumReplySection
          clubSlug={clubSlug}
          threadId={thread.id}
          isLocked={thread.is_locked}
          userId={userId}
          isModerator={isMod}
        />
      </div>
    </div>
  );
}
```

**Step 6: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 7: Commit**

```bash
git add src/app/(frontend)/(participant)/clubs/[slug]/forum/ \
  src/components/clubs/forum/
git commit -m "feat(forum): add thread detail page with replies, polls, and admin controls"
```

---

### Task 14: Forum Category Manager (Admin Settings)

Add a category management UI to the club settings or as a section in the admin controls.

**Files:**

- Create: `src/components/clubs/forum/ForumCategoryManager.tsx`

**Step 1: Create the category manager**

Create `src/components/clubs/forum/ForumCategoryManager.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

import { type ForumCategory } from "@/lib/clubs/types";

interface ForumCategoryManagerProps {
  clubSlug: string;
}

export default function ForumCategoryManager({ clubSlug }: ForumCategoryManagerProps) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`);
    if (res.ok) {
      const data = (await res.json()) as { categories: ForumCategory[] };
      setCategories(data.categories);
    }
    setLoading(false);
  }, [clubSlug]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.ok) {
      setNewName("");
      void fetchCategories();
    }
    setAdding(false);
  };

  const handleDelete = async (categoryId: string) => {
    if (!globalThis.confirm("Delete this category? Threads will become uncategorized.")) return;

    const res = await fetch(`/api/clubs/${clubSlug}/forum/categories/${categoryId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Forum Categories</h4>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No categories yet. Add one below.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={50}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/clubs/forum/ForumCategoryManager.tsx
git commit -m "feat(forum): add category manager component for admins"
```

---

### Task 15: Upload Folder Whitelist + Final Verification

Allow forum image uploads and run full verification.

**Files:**

- Modify: `src/app/(frontend)/api/upload/route.ts:8-13`

**Step 1: Add clubs/forum to allowed upload folders**

In `src/app/(frontend)/api/upload/route.ts`, add `"clubs/forum"` to the `ALLOWED_FOLDERS` set (line 12):

```typescript
const ALLOWED_FOLDERS = new Set([
  "events/covers",
  "badges/images",
  "organizers/logos",
  "reviews/photos",
  "clubs/forum",
]);
```

**Step 2: Run full CI checks**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

Expected: All pass.

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/upload/route.ts
git commit -m "feat(forum): allow forum image uploads"
```

---

### Task 16: Barrel Export and Integration Test

Add barrel exports for forum components and do a manual smoke test.

**Files:**

- Modify: `src/components/clubs/index.ts` (if it exists, add forum exports)

**Step 1: Verify all forum components are importable**

Run: `pnpm typecheck`
Expected: PASS

**Step 2: Run full build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Final commit**

If any fixes are needed, commit them. Then verify the full branch is clean:

```bash
git status
git log --oneline -10
```
