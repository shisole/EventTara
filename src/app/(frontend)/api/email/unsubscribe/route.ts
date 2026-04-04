import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const uid = body?.uid as string | undefined;

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify user exists
  const { data: user } = await supabase.from("users").select("id").eq("id", uid).single();

  if (!user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  // Insert unsubscribe (upsert to handle duplicates)
  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert({ user_id: uid }, { onConflict: "user_id" });

  if (error) {
    console.error("[Unsubscribe] Error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
