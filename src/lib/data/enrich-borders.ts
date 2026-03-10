import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

interface BorderDef {
  id: string;
  tier: string;
  border_color: string | null;
}

/**
 * Enrich reviews (event or guide) with border tier and color from the user's active border.
 * Each review must have `users.active_border_id`.
 */
export async function enrichReviewsWithBorders<
  T extends { users?: { active_border_id?: string | null } | null },
>(supabase: SupabaseClient<Database>, reviews: T[]) {
  const borderIds = reviews
    .map((r) => r.users?.active_border_id)
    .filter((id): id is string => !!id);

  if (borderIds.length === 0) {
    return reviews.map((r) => ({
      ...r,
      users: {
        ...r.users,
        active_border_tier: null as string | null,
        active_border_color: null as string | null,
      },
    }));
  }

  const { data: borderDefs } = await supabase
    .from("avatar_borders")
    .select("id, tier, border_color")
    .in("id", borderIds);

  const borderLookup = new Map<string, BorderDef>((borderDefs || []).map((b) => [b.id, b]));

  return reviews.map((r) => {
    const borderId = r.users?.active_border_id;
    const border = borderId ? borderLookup.get(borderId) : null;
    return {
      ...r,
      users: {
        ...r.users,
        active_border_tier: border?.tier ?? null,
        active_border_color: border?.border_color ?? null,
      },
    };
  });
}

export interface BorderTierInfo {
  tier: string | null;
  color: string | null;
}

/**
 * Build a lookup of userId -> border info from bookings/records that have `users.active_border_id`.
 * Used in dashboard pages for badge awarder UI.
 */
export async function buildBorderLookupByUserId(
  supabase: SupabaseClient<Database>,
  records: { user_id: string; users?: { active_border_id?: string | null } | null }[],
): Promise<Record<string, BorderTierInfo>> {
  const borderIds = records
    .map((r) => r.users?.active_border_id)
    .filter((id): id is string => !!id);

  const result: Record<string, BorderTierInfo> = {};

  if (borderIds.length === 0) return result;

  const { data: borders } = await supabase
    .from("avatar_borders")
    .select("id, tier, border_color")
    .in("id", borderIds);

  if (!borders) return result;

  const borderMap = new Map<string, BorderDef>(borders.map((b) => [b.id, b]));

  for (const record of records) {
    const activeBorderId = record.users?.active_border_id;
    if (activeBorderId) {
      const border = borderMap.get(activeBorderId);
      if (border) {
        result[record.user_id] = {
          tier: border.tier,
          color: border.border_color,
        };
      }
    }
  }

  return result;
}
