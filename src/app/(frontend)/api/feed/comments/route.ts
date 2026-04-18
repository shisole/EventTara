import { NextResponse } from "next/server";

import type { BorderTier } from "@/lib/constants/avatar-borders";
import { extractMentions, resolveUsernames } from "@/lib/feed/mentions";
import type { ActivityType, FeedComment } from "@/lib/feed/types";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = new Set<string>(["booking", "checkin", "badge", "border"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawType = searchParams.get("activity_type");
  const activityId = searchParams.get("activity_id");

  if (!rawType || !activityId || !VALID_TYPES.has(rawType)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const activityType = rawType as ActivityType;

  const supabase = await createClient();

  // Get current user for isLiked status
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const currentUserId = authUser?.id ?? null;

  const { data: rows, error } = await supabase
    .from("feed_comments")
    .select("id, user_id, text, created_at")
    .eq("activity_type", activityType)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[feed-comments GET] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ comments: [] });
  }

  // Fetch user profiles
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, active_border_id")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  // Resolve border tier/color
  const borderIds = (users || []).filter((u) => u.active_border_id).map((u) => u.active_border_id!);

  const borderMap = new Map<string, { tier: BorderTier; color: string | null }>();
  if (borderIds.length > 0) {
    const { data: borders } = await supabase
      .from("avatar_borders")
      .select("id, tier, border_color")
      .in("id", borderIds);
    for (const b of borders || []) {
      borderMap.set(b.id, { tier: b.tier as BorderTier, color: b.border_color });
    }
  }

  // Fetch comment like counts and current user's likes
  const commentIds = rows.map((r) => r.id);

  const { data: allLikes } = await supabase
    .from("feed_comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds);

  const likeCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();

  for (const like of allLikes || []) {
    likeCountMap.set(like.comment_id, (likeCountMap.get(like.comment_id) || 0) + 1);
    if (currentUserId && like.user_id === currentUserId) {
      userLikedSet.add(like.comment_id);
    }
  }

  const comments: FeedComment[] = rows.map((r) => {
    const user = userMap.get(r.user_id);
    const border = user?.active_border_id ? borderMap.get(user.active_border_id) : null;

    return {
      id: r.id,
      userId: r.user_id,
      userName: user?.full_name || "Unknown",
      userUsername: user?.username || null,
      userAvatarUrl: user?.avatar_url || null,
      borderTier: border?.tier || null,
      borderColor: border?.color || null,
      text: r.text,
      createdAt: r.created_at,
      likeCount: likeCountMap.get(r.id) || 0,
      isLiked: userLikedSet.has(r.id),
    };
  });

  return NextResponse.json({ comments });
}

interface CommentBody {
  activityType: ActivityType;
  activityId: string;
  text: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CommentBody;

  if (!VALID_TYPES.has(body.activityType) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length === 0 || text.length > 300) {
    return NextResponse.json({ error: "Comment must be 1-300 characters" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("feed_comments")
    .insert({
      user_id: authUser.id,
      activity_type: body.activityType,
      activity_id: body.activityId,
      text,
    })
    .select("id, user_id, text, created_at")
    .single();

  if (error) {
    console.error("[feed-comments POST] DB error:", error.message);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  // Fetch the commenter's profile
  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, active_border_id")
    .eq("id", authUser.id)
    .single();

  let borderTier: BorderTier | null = null;
  let borderColor: string | null = null;

  if (user?.active_border_id) {
    const { data: border } = await supabase
      .from("avatar_borders")
      .select("tier, border_color")
      .eq("id", user.active_border_id)
      .single();
    if (border) {
      borderTier = border.tier as BorderTier;
      borderColor = border.border_color;
    }
  }

  const comment: FeedComment = {
    id: row.id,
    userId: row.user_id,
    userName: user?.full_name || "Unknown",
    userUsername: user?.username || null,
    userAvatarUrl: user?.avatar_url || null,
    borderTier,
    borderColor,
    text: row.text,
    createdAt: row.created_at,
    likeCount: 0,
    isLiked: false,
  };

  // Handle @mentions — fire-and-forget
  const mentionedUsernames = extractMentions(text);
  if (mentionedUsernames.length > 0) {
    resolveUsernames(supabase, mentionedUsernames)
      .then((resolved) => {
        const commenterName = user?.full_name || "Someone";
        const notifications = [...resolved.values()].map((mentioned) => ({
          userId: mentioned.id,
          type: "feed_mention" as const,
          title: "You were mentioned",
          body: `${commenterName} mentioned you in a comment.`,
          href: `/post/${body.activityId}`,
          actorId: authUser.id,
        }));
        if (notifications.length > 0) {
          return createNotifications(supabase, notifications);
        }
      })
      .catch(() => null);
  }

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
  }

  await supabase.from("feed_comments").delete().eq("id", id).eq("user_id", authUser.id);

  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}
