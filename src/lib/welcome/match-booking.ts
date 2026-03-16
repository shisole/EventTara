export interface UnclaimedBooking {
  id: string;
  manual_name: string | null;
  event_distance_id: string | null;
}

/**
 * Find a booking whose `manual_name` matches a user's full name
 * (case-insensitive, trimmed). Returns the first match or `null`.
 *
 * If multiple bookings share the same normalized name, returns `null`
 * to force the user to pick manually (ambiguous match).
 */
export function matchBookingByName(
  bookings: UnclaimedBooking[],
  fullName: string | null | undefined,
): UnclaimedBooking | null {
  if (!fullName) return null;

  const normalized = fullName.trim().toLowerCase();
  if (!normalized) return null;

  const matches = bookings.filter((b) => b.manual_name?.trim().toLowerCase() === normalized);

  // Ambiguous — let the user pick
  if (matches.length !== 1) return null;

  return matches[0];
}
