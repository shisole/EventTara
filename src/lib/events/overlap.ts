/**
 * Computes the effective end datetime for an event.
 * If end_date is set, use it. Otherwise, assume the event runs from start time to end of day.
 */
export function getEffectiveEnd(date: string, endDate: string | null): Date {
  if (endDate) {
    return new Date(endDate);
  }
  // No end date — block from start time to end of the same day
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Checks if two time ranges overlap.
 * Uses strict < comparison so touching boundaries (A ends at 12:00, B starts at 12:00) are allowed.
 */
export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA;
}

export interface OverlappingEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
}

/**
 * Finds any event from the given list that overlaps with the specified time range.
 * Returns the first overlapping event, or null if none overlap.
 */
export function findOverlappingEvent(
  targetDate: string,
  targetEndDate: string | null,
  existingEvents: OverlappingEvent[],
  excludeEventId?: string,
): OverlappingEvent | null {
  const targetStart = new Date(targetDate);
  const targetEnd = getEffectiveEnd(targetDate, targetEndDate);

  for (const event of existingEvents) {
    if (excludeEventId && event.id === excludeEventId) continue;

    const eventStart = new Date(event.date);
    const eventEnd = getEffectiveEnd(event.date, event.end_date);

    if (rangesOverlap(targetStart, targetEnd, eventStart, eventEnd)) {
      return event;
    }
  }

  return null;
}

/**
 * Formats a date for display in overlap error messages.
 */
export function formatOverlapDate(date: string, endDate: string | null): string {
  const start = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const startStr = start.toLocaleDateString("en-US", options);

  if (endDate) {
    const end = new Date(endDate);
    const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${startStr} – ${endStr}`;
  }
  return startStr;
}
