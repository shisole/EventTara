import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      anonymous_id,
      activities,
      experience_level,
      first_name,
      age_range,
      location,
      discovery_source,
      completed_at,
      skipped_at_step,
    } = body;

    if (!anonymous_id) {
      return NextResponse.json({ error: "anonymous_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("quiz_responses").upsert(
      {
        anonymous_id,
        activities: activities ?? [],
        experience_level: experience_level ?? null,
        first_name: first_name ?? null,
        age_range: age_range ?? null,
        location: location ?? null,
        discovery_source: discovery_source ?? null,
        completed_at: completed_at ?? null,
        skipped_at_step: skipped_at_step ?? null,
        user_id: user?.id ?? null,
      },
      { onConflict: "anonymous_id" },
    );

    if (error) {
      console.error("[Quiz] Insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // Award quiz completion tokens (idempotent)
    if (completed_at && user?.id) {
      void (async () => {
        const { data: existingTx } = await supabase
          .from("token_transactions")
          .select("id")
          .eq("user_id", user.id)
          .eq("reference_id", "quiz_completed")
          .limit(1)
          .maybeSingle();
        if (!existingTx) {
          await awardTokens(
            supabase,
            user.id,
            TOKEN_REWARDS.quiz_completed,
            "milestone",
            "quiz_completed",
          );
        }
      })().catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
