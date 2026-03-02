import { NextResponse } from "next/server";

import type { ActivityType } from "@/lib/feed/types";
import { createNotification } from "@/lib/notifications/create";
import { resolveActivityOwner } from "@/lib/notifications/resolve-activity-owner";
import { createClient } from "@/lib/supabase/server";

interface RepostBody {
  activityType: ActivityType;
  activityId: string;
}

const VALID_TYPES = new Set(["booking", "checkin", "badge", "border"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as RepostBody;
  if (!VALID_TYPES.has(body.activityType) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { error } = await supabase.from("feed_reposts").insert({
    user_id: user.id,
    activity_type: body.activityType,
    activity_id: body.activityId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already reposted" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify activity owner of the repost (fire-and-forget)
  resolveActivityOwner(supabase, body.activityType, body.activityId)
    .then((ownerId) => {
      if (!ownerId) return;
      return createNotification(supabase, {
        userId: ownerId,
        type: "feed_repost",
        title: "New Repost",
        body: `${user.user_metadata?.full_name || "Someone"} reposted your activity.`,
        href: `/post/${body.activityId}`,
        actorId: user.id,
      });
    })
    .catch(() => null);

  return NextResponse.json({ message: "Reposted" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as RepostBody;
  if (!VALID_TYPES.has(body.activityType) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  await supabase
    .from("feed_reposts")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_type", body.activityType)
    .eq("activity_id", body.activityId);

  return NextResponse.json({ message: "Removed" }, { status: 200 });
}
