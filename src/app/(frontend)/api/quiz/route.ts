import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
