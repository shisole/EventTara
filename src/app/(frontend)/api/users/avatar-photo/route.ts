import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Allowed hostnames for photo URLs */
const ALLOWED_HOSTS = new Set([
  "dgalywyr863hv.cloudfront.net", // Strava CDN
  "lh3.googleusercontent.com", // Google profile photos
]);

function isAllowedPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    // Allow Supabase storage
    if (parsed.hostname.endsWith(".supabase.co")) return true;
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * PATCH /api/users/avatar-photo
 * Sets the user's avatar to a photo URL (Strava/Google) and clears the animal avatar.
 * Body: { photo_url: string }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { photo_url } = body as { photo_url?: string };

  if (!photo_url || typeof photo_url !== "string") {
    return NextResponse.json({ error: "photo_url is required" }, { status: 400 });
  }

  if (!isAllowedPhotoUrl(photo_url)) {
    return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
  }

  // Update users.avatar_url
  const { error: userError } = await supabase
    .from("users")
    .update({ avatar_url: photo_url })
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Clear animal avatar in config
  const { error: configError } = await supabase
    .from("user_avatar_config")
    .upsert(
      {
        user_id: user.id,
        animal_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 });
  }

  // Update auth metadata so navbar avatar stays in sync
  await supabase.auth.updateUser({ data: { avatar_url: photo_url } });

  return NextResponse.json({ success: true });
}
