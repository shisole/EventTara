import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Build a unique username string (does NOT update the DB).
 * Useful when you need the value for an INSERT rather than an UPDATE.
 */
export async function buildUsername(
  supabase: SupabaseClient<Database>,
  preferredName: string | undefined,
  email: string,
): Promise<string> {
  const prefix = preferredName?.trim()
    ? preferredName
        .trim()
        .toLowerCase()
        .replaceAll(/\s+/g, ".")
        .replaceAll(/[^a-z0-9._-]/g, "")
    : email
        .trim()
        .split("@")[0]
        .toLowerCase()
        .replaceAll(/[^a-z0-9._-]/g, "");
  let username = prefix || "user";

  const { data: taken } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (taken) {
    username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
  }

  return username;
}

/**
 * Auto-generate a username from a preferred name or email prefix.
 * Sanitizes the value, checks for collisions, and appends a random suffix if taken.
 */
export async function generateUsername(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  preferredName?: string,
): Promise<void> {
  const { data: existingUser } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (existingUser?.username) return;

  // "Stephen Karl Hisole" → "stephen.karl.hisole", or fall back to email prefix
  const prefix = preferredName?.trim()
    ? preferredName
        .trim()
        .toLowerCase()
        .replaceAll(/\s+/g, ".")
        .replaceAll(/[^a-z0-9._-]/g, "")
    : email
        .trim()
        .split("@")[0]
        .toLowerCase()
        .replaceAll(/[^a-z0-9._-]/g, "");
  let username = prefix || "user";

  const { data: taken } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (taken) {
    username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
  }

  await supabase.from("users").update({ username }).eq("id", userId);
}
