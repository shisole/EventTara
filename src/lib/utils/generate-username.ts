import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Auto-generate a username from an email prefix.
 * Sanitizes the local part, checks for collisions, and appends a random suffix if taken.
 */
export async function generateUsername(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
): Promise<void> {
  const { data: existingUser } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();

  if (existingUser?.username) return;

  const prefix = email
    .trim()
    .split("@")[0]
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]/g, "");
  let username = prefix || "user";

  const { data: taken } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (taken) {
    username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
  }

  await supabase.from("users").update({ username }).eq("id", userId);
}
