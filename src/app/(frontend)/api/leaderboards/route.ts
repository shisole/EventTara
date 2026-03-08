import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get("metric") ?? "most_badges";
  const scope = searchParams.get("scope") ?? "global";
  const limit = Math.min(Number.parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's friends (people they follow)
  let friendIds: string[] = [];
  if (scope === "friends") {
    const { data } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    friendIds = (data ?? []).map((r) => r.following_id);
    // Include self in friends leaderboard
    friendIds.push(user.id);
  }

  let query = supabase.from("users").select("id, full_name, username, avatar_url");

  if (scope === "friends" && friendIds.length > 0) {
    query = query.in("id", friendIds);
  }

  // Exclude guests
  query = query.neq("role", "guest");

  const { data: users } = await query;

  if (!users || users.length === 0) {
    return NextResponse.json({ leaderboards: [], yourRank: null });
  }

  const leaderboardData: {
    rank: number;
    user_id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    metric_value: number;
  }[] = [];

  for (const usr of users) {
    let metricValue = 0;

    switch (metric) {
      case "most_badges": {
        const { count } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", usr.id);
        metricValue = count ?? 0;

        break;
      }
      case "most_summits": {
        const { data: checkins } = await supabase
          .from("event_checkins")
          .select("event_id")
          .eq("user_id", usr.id);
        const eventIds = (checkins ?? []).map((c) => c.event_id);
        if (eventIds.length > 0) {
          const { data: eventMountains } = await supabase
            .from("event_mountains")
            .select("mountain_id")
            .in("event_id", eventIds);
          const mountains = new Set((eventMountains ?? []).map((em) => em.mountain_id));
          metricValue = mountains.size;
        }

        break;
      }
      case "highest_rarity": {
        const rarityMap: Record<string, number> = {
          legendary: 4,
          epic: 3,
          rare: 2,
          common: 1,
        };
        const { data: badges } = await supabase
          .from("user_badges")
          .select("badges(rarity)")
          .eq("user_id", usr.id);
        for (const b of badges ?? []) {
          const badge = b.badges as unknown as { rarity: string } | null;
          metricValue += rarityMap[badge?.rarity ?? "common"] ?? 0;
        }

        break;
      }
      case "most_active": {
        const { count } = await supabase
          .from("event_checkins")
          .select("*", { count: "exact", head: true })
          .eq("user_id", usr.id);
        metricValue = count ?? 0;

        break;
      }
      // No default
    }

    if (metricValue > 0) {
      leaderboardData.push({
        rank: 0,
        user_id: usr.id,
        full_name: usr.full_name,
        username: usr.username,
        avatar_url: usr.avatar_url,
        metric_value: metricValue,
      });
    }
  }

  // Sort and assign ranks
  leaderboardData.sort((a, b) => b.metric_value - a.metric_value);
  for (const [index, item] of leaderboardData.entries()) {
    item.rank = index + 1;
  }

  const userRank = leaderboardData.find((item) => item.user_id === user.id);

  return NextResponse.json({
    leaderboards: leaderboardData.slice(0, limit),
    yourRank: userRank?.rank ?? null,
  });
}
