import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string; threadId: string }>;
}

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
    .select("*, club_forum_categories(id, name, slug)")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();

  if (error || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Fetch author separately (FK references auth.users, not public.users)
  const { data: author } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url")
    .eq("id", thread.user_id)
    .single();

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
    author: author ?? null,
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

  if (body.is_pinned !== undefined) {
    const pinRole = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.pin_thread);
    if (!pinRole) return NextResponse.json({ error: "Only admins can pin" }, { status: 403 });
    updates.is_pinned = body.is_pinned;
  }

  if (body.is_locked !== undefined) {
    const lockRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.lock_thread,
    );
    if (!lockRole) {
      return NextResponse.json({ error: "Only moderators can lock" }, { status: 403 });
    }
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
