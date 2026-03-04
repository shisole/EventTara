import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Extract @username mentions from comment text.
 * Matches `@` followed by word characters (letters, digits, underscores).
 * Returns unique usernames (without the `@` prefix).
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];

  const usernames = [...new Set(matches.map((m) => m.slice(1)))];
  return usernames;
}

interface ResolvedUser {
  id: string;
  username: string;
}

/**
 * Look up user IDs from an array of usernames.
 * Returns a Map of username → { id, username } for found users.
 */
export async function resolveUsernames(
  supabase: SupabaseClient<Database>,
  usernames: string[],
): Promise<Map<string, ResolvedUser>> {
  if (usernames.length === 0) return new Map();

  const { data } = await supabase.from("users").select("id, username").in("username", usernames);

  const map = new Map<string, ResolvedUser>();
  for (const user of data || []) {
    if (user.username) {
      map.set(user.username, { id: user.id, username: user.username });
    }
  }
  return map;
}
