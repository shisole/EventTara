export interface ParsedEntry {
  time: string;
  title: string;
  raw: string;
}

export function parseItinerary(text: string): ParsedEntry[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((raw) => {
    // Match: time (with optional AM/PM), then a separator (- -- – —), then the title
    // Time pattern: H:MM or HH:MM, optionally followed by space? + AM/PM
    const match = /^(\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)\s*(?:--|[–—-])\s*(.+)$/.exec(raw);

    if (match) {
      return { time: match[1].trim(), title: match[2].trim(), raw };
    }

    return { time: "", title: raw, raw };
  });
}
