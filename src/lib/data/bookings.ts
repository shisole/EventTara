/**
 * Split bookings into upcoming and past based on event date.
 * Bookings without an event are excluded.
 */
export function splitBookingsByDate<T extends { events?: { date: string } | null }>(
  bookings: T[],
): { upcoming: T[]; past: T[] } {
  const now = new Date();
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const b of bookings) {
    if (!b.events) continue;
    if (new Date(b.events.date) >= now) {
      upcoming.push(b);
    } else {
      past.push(b);
    }
  }

  return { upcoming, past };
}
