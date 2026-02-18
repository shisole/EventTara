import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create organizer profile
  let { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    // Auto-create organizer profile
    const { data: newProfile, error: profileError } = await supabase
      .from("organizer_profiles")
      .insert({ user_id: user.id, org_name: user.user_metadata?.full_name || "My Organization" })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    profile = newProfile;

    // Update user role to organizer
    await supabase.from("users").update({ role: "organizer" }).eq("id", user.id);
  }

  const body = await request.json();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: profile!.id,
      title: body.title,
      description: body.description,
      type: body.type,
      date: body.date,
      location: body.location,
      max_participants: body.max_participants,
      price: body.price,
      cover_image_url: body.cover_image_url,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}
