import { NextResponse } from "next/server";

import type { ActivityType } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

interface ReactionBody {
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

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { error } = await supabase.from("feed_reactions").insert({
    user_id: user.id,
    activity_type: body.activityType,
    activity_id: body.activityId,
    emoji: "heart",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already liked" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Liked" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  await supabase
    .from("feed_reactions")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_type", body.activityType)
    .eq("activity_id", body.activityId);

  return NextResponse.json({ message: "Removed" }, { status: 200 });
}
