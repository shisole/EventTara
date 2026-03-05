import { type createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve an organizer profile ID from either a UUID or a username.
 * Returns the organizer_profiles.id or null if not found.
 */
export async function resolveOrganizerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idOrUsername: string,
): Promise<string | null> {
  // Try UUID lookup first
  if (UUID_REGEX.test(idOrUsername)) {
    const { data } = await supabase
      .from("organizer_profiles")
      .select("id")
      .eq("id", idOrUsername)
      .single();
    if (data) return data.id;
  }

  // Fall back to username lookup via users table
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", idOrUsername)
    .single();

  if (!user) return null;

  const { data: orgProfile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return orgProfile?.id ?? null;
}
