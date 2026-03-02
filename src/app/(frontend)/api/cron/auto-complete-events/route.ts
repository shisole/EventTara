import { NextResponse } from "next/server";

import { onEventCompleted } from "@/lib/badges/award-event-badge";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find published events where end_date (or date) is 48+ hours in the past
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: staleEvents, error } = await supabase
    .from("events")
    .select("id, end_date, date")
    .eq("status", "published");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toComplete = (staleEvents ?? []).filter((e) => {
    const effectiveEnd = e.end_date ?? e.date;
    return effectiveEnd < cutoff;
  });

  let completed = 0;

  for (const event of toComplete) {
    const { error: updateError } = await supabase
      .from("events")
      .update({ status: "completed" as const })
      .eq("id", event.id);

    if (updateError) {
      console.error(`[auto-complete] Failed to complete event ${event.id}:`, updateError.message);
      continue;
    }

    await onEventCompleted(event.id, supabase);
    completed++;
  }

  return NextResponse.json({ completed });
}
