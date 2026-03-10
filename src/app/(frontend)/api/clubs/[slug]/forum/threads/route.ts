import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { type ForumThreadType } from "@/lib/clubs/types";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

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
    .select("*, club_forum_categories(id, name, slug)", { count: "exact" })
    .eq("club_id", club.id)
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
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

  // Fetch author profiles separately (FK references auth.users, not public.users)
  const userIds = [...new Set((threads ?? []).map((t) => t.user_id))];
  const { data: users } =
    userIds.length > 0
      ? await supabase.from("users").select("id, full_name, username, avatar_url").in("id", userIds)
      : { data: [] };
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    author: userMap.get(t.user_id) ?? null,
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

  if (!title || title.length === 0 || title.length > 200) {
    return NextResponse.json({ error: "Title is required (1-200 chars)" }, { status: 400 });
  }

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

  const { data: authorProfile } = await supabase
    .from("users")
    .select("full_name, username")
    .eq("id", user.id)
    .single();
  const authorName = authorProfile?.full_name ?? authorProfile?.username ?? "Someone";

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
