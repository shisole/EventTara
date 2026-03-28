export interface ParsedEntry {
  time: string;
  title: string;
  raw: string;
}

function isTimeOnly(line: string): boolean {
  return (
    /^(?:around\s+)?\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\s*(?:(?:–|—|--|-)\s*\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)?\s*(?:onwards)?$/i.test(
      line,
    ) || /^(?:evening|morning|afternoon|night|dawn|sunrise|sunset)$/i.test(line)
  );
}

function isDayHeader(line: string): boolean {
  return /^day\s+\d+$/i.test(line);
}

function isSkippableHeader(line: string): boolean {
  return /^itinerary$/i.test(line);
}

function isInlineEntry(line: string): RegExpExecArray | null {
  const match = /^(\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)\s*(?:--|[–—-])\s*(.+)$/.exec(line);
  if (!match) return null;
  // If the "title" part is just another time, this is a time range, not inline
  if (/^\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?$/.test(match[2].trim())) return null;
  return match;
}

export function parseItinerary(text: string): ParsedEntry[] {
  const lines = text.split("\n").map((l) => l.trim());
  const entries: ParsedEntry[] = [];
  let i = 0;
  let currentDay = "";

  while (i < lines.length) {
    const line = lines[i];

    if (!line) {
      i++;
      continue;
    }

    if (isSkippableHeader(line)) {
      i++;
      continue;
    }

    if (isDayHeader(line)) {
      currentDay = line;
      i++;
      continue;
    }

    // Inline format: "4:00 AM - Assembly at trailhead"
    const inlineMatch = isInlineEntry(line);
    if (inlineMatch) {
      const time = currentDay ? `${currentDay} — ${inlineMatch[1].trim()}` : inlineMatch[1].trim();
      entries.push({ time, title: inlineMatch[2].trim(), raw: line });
      i++;
      continue;
    }

    // Time-only line: look ahead for description on following lines
    if (isTimeOnly(line)) {
      const time = currentDay ? `${currentDay} — ${line}` : line;
      i++;

      const descriptions: string[] = [];
      const rawParts = [line];

      while (i < lines.length) {
        const nextLine = lines[i].trim();

        if (!nextLine) {
          i++;
          continue;
        }

        // Stop collecting if next line is a new time block, day header, or header
        if (
          isTimeOnly(nextLine) ||
          isDayHeader(nextLine) ||
          isSkippableHeader(nextLine) ||
          isInlineEntry(nextLine)
        ) {
          break;
        }

        descriptions.push(nextLine);
        rawParts.push(nextLine);
        i++;
      }

      entries.push({
        time,
        title: descriptions.length > 0 ? descriptions.join("; ") : line,
        raw: rawParts.join("\n"),
      });
      continue;
    }

    // Unparsed line
    entries.push({ time: "", title: line, raw: line });
    i++;
  }

  return entries;
}
