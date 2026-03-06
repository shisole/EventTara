import { NextResponse } from "next/server";

import { checkAndAwardPioneerBadges } from "@/lib/badges/check-pioneer-badges";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const result = await checkAndAwardPioneerBadges(supabase);

  return NextResponse.json(result);
}
