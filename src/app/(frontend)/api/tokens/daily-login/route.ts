import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("users")
    .select("last_daily_login, login_streak")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Already claimed today
  if (profile.last_daily_login === today) {
    return NextResponse.json({ already_claimed: true, streak: profile.login_streak });
  }

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const isConsecutive = profile.last_daily_login === yesterdayStr;
  const newStreak = isConsecutive ? profile.login_streak + 1 : 1;

  // Update user login state
  await supabase
    .from("users")
    .update({ last_daily_login: today, login_streak: newStreak })
    .eq("id", user.id);

  // Award daily login tokens
  const newBalance = await awardTokens(supabase, user.id, TOKEN_REWARDS.daily_login, "daily_login");

  // Award streak bonus at 7-day intervals
  let streakBonus = false;
  if (newStreak > 0 && newStreak % 7 === 0) {
    await awardTokens(supabase, user.id, TOKEN_REWARDS.streak_bonus, "streak_bonus");
    streakBonus = true;
  }

  return NextResponse.json({
    already_claimed: false,
    tokens_earned: TOKEN_REWARDS.daily_login,
    streak: newStreak,
    streak_bonus: streakBonus,
    new_balance: newBalance,
  });
}
