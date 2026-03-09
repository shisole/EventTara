// DEPRECATED: Organizer waitlist is no longer needed — clubs are self-service.
// This route is kept for backward compatibility with the existing organizer_waitlist table.
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("organizer_waitlist")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
