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

  // Idempotency check: has this user already received the signup bonus?
  const { data: existing } = await supabase
    .from("token_transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("reference_id", "signup")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ already_claimed: true });
  }

  const newBalance = await awardTokens(
    supabase,
    user.id,
    TOKEN_REWARDS.signup,
    "milestone",
    "signup",
  );

  return NextResponse.json({ tokens_earned: TOKEN_REWARDS.signup, new_balance: newBalance });
}
