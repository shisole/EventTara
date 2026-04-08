"use client";

import { useState } from "react";

import { ChevronDownIcon } from "@/components/icons";

interface ItineraryEntry {
  id: string;
  time: string;
  title: string;
  sort_order: number;
}

interface EventItineraryProps {
  entries: ItineraryEntry[];
}

interface DayGroup {
  day: string;
  entries: { id: string; time: string; title: string }[];
}

function groupByDay(entries: ItineraryEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let currentDay = "";

  for (const entry of entries) {
    // Check if time starts with "Day N — " prefix
    const dayMatch = /^(Day\s+\d+)\s*—\s*(.+)$/i.exec(entry.time);

    if (dayMatch) {
      const day = dayMatch[1];
      const time = dayMatch[2];

      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, entries: [] });
      }
      groups.at(-1)?.entries.push({ id: entry.id, time, title: entry.title });
    } else {
      // No day prefix — put in a default group
      if (groups.length === 0 || currentDay !== "") {
        currentDay = "";
        groups.push({ day: "", entries: [] });
      }
      groups.at(-1)?.entries.push({
        id: entry.id,
        time: entry.time,
        title: entry.title,
      });
    }
  }

  return groups;
}

export default function EventItinerary({ entries }: EventItineraryProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const groups = groupByDay(entries);
  const hasMultipleGroups = groups.length > 1 || Boolean(groups[0]?.day);
  const hasHiddenDays = groups.length > 1;
  const visibleGroups = expanded || !hasHiddenDays ? groups : groups.slice(0, 1);
  const hiddenCount = groups.length - 1;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Itinerary</h2>
      <div className="space-y-6">
        {visibleGroups.map((group, gi) => (
          <div key={gi}>
            {hasMultipleGroups && group.day && (
              <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {group.day}
              </h3>
            )}
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <ol className="space-y-4">
                {group.entries.map((entry) => (
                  <li key={entry.id} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-gray-900 shadow-sm" />
                    <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 leading-none mb-0.5">
                      {entry.time}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{entry.title}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
      {hasHiddenDays && (
        <button
          type="button"
          onClick={() => {
            setExpanded((prev) => !prev);
          }}
          aria-expanded={expanded}
          className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {expanded
            ? "Show less"
            : `Show full itinerary (${hiddenCount} more day${hiddenCount === 1 ? "" : "s"})`}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
