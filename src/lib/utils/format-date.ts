/**
 * Formats event dates with Philippine locale (en-PH).
 * Handles both single-day and multi-day events.
 */
export function formatEventDate(
  date: string,
  endDate?: string | null,
  options?: { includeTime?: boolean; includeYear?: boolean; short?: boolean },
): string {
  const { includeTime = false, includeYear = true, short = false } = options || {};

  const startDate = new Date(date);
  const start = {
    weekday: startDate.toLocaleDateString("en-PH", { weekday: short ? "short" : "long" }),
    month: startDate.toLocaleDateString("en-PH", { month: short ? "short" : "long" }),
    day: startDate.getDate(),
    year: startDate.getFullYear(),
  };

  // Single-day event
  if (!endDate || endDate === date) {
    let result = "";

    if (short) {
      // "Feb 25" or "Feb 25, 2026"
      result = `${start.month} ${start.day}`;
      if (includeYear) {
        result += `, ${start.year}`;
      }
    } else {
      // "Sat, Feb 25, 2026" or "Saturday, February 25, 2026"
      result = `${start.weekday}, ${start.month} ${start.day}`;
      if (includeYear) {
        result += `, ${start.year}`;
      }
    }

    if (includeTime) {
      const time = startDate.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
      });
      result += ` at ${time}`;
    }

    return result;
  }

  // Multi-day event
  const endDateObj = new Date(endDate);
  const end = {
    month: endDateObj.toLocaleDateString("en-PH", { month: short ? "short" : "long" }),
    day: endDateObj.getDate(),
    year: endDateObj.getFullYear(),
  };

  // Check if same month
  if (start.month === end.month && start.year === end.year) {
    // "Feb 25 - 27, 2026"
    let result = `${start.month} ${start.day} - ${end.day}`;
    if (includeYear) {
      result += `, ${start.year}`;
    }
    return result;
  }

  // Different months
  if (start.year === end.year) {
    // "Feb 25 - Mar 2, 2026"
    let result = `${start.month} ${start.day} - ${end.month} ${end.day}`;
    if (includeYear) {
      result += `, ${start.year}`;
    }
    return result;
  }

  // Different years (rare but handle it)
  return `${start.month} ${start.day}, ${start.year} - ${end.month} ${end.day}, ${end.year}`;
}
