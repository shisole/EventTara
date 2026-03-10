import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Fetch companions for a set of booking IDs and group them by booking_id.
 *
 * @param selectColumns - Columns to select (e.g. "booking_id, full_name, qr_code" or "id, booking_id, full_name, status")
 */
export async function fetchCompanionsByBooking<T extends { booking_id: string }>(
  supabase: SupabaseClient<Database>,
  bookingIds: string[],
  selectColumns: string,
): Promise<Record<string, T[]>> {
  const result: Record<string, T[]> = {};
  if (bookingIds.length === 0) return result;

  const { data: companions } = await supabase
    .from("booking_companions")
    .select(selectColumns)
    .in("booking_id", bookingIds);

  if (companions) {
    for (const c of companions as unknown as T[]) {
      if (!result[c.booking_id]) result[c.booking_id] = [];
      result[c.booking_id].push(c);
    }
  }

  return result;
}
