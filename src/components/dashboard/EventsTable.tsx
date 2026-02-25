"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

import { Button, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

const statusStyles: Record<string, string> = {
  draft: "default",
  published: "hiking",
  completed: "running",
  cancelled: "default",
};

type SortKey = "title" | "date" | "status" | "bookings";
type SortDir = "asc" | "desc";

interface EventsTableProps {
  events: any[];
}

export default function EventsTable({ events }: EventsTableProps) {
  // null = default sort (active first, then by date asc)
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const statusOrder: Record<string, number> = {
      draft: 0,
      published: 1,
      completed: 2,
      cancelled: 3,
    };
    const isActive = (e: any) => e.status === "draft" || e.status === "published";

    // Default sort: active events by upcoming date, then completed/cancelled
    if (sortKey === null) {
      return [...events].sort((a, b) => {
        const aActive = isActive(a);
        const bActive = isActive(b);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }

    // User-triggered sort: sort all events by the selected column
    return [...events].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title": {
          cmp = a.title.localeCompare(b.title);
          break;
        }
        case "date": {
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        }
        case "status": {
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        }
        case "bookings": {
          cmp = (a.bookings?.[0]?.count || 0) - (b.bookings?.[0]?.count || 0);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [events, sortKey, sortDir]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      onClick={() => {
        handleSort(field);
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn("text-xs", sortKey === field ? "opacity-100" : "opacity-0")}>
          {sortKey === field && sortDir === "asc" ? "▲" : "▼"}
        </span>
      </span>
    </th>
  );

  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {sorted.map((event: any) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/dashboard/events/${event.id}`}
                className="font-heading font-bold dark:text-white hover:text-lime-600 dark:hover:text-lime-400 line-clamp-2"
              >
                {event.title}
              </Link>
              <UIBadge variant={statusStyles[event.status] as any}>{event.status}</UIBadge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{formatEventDate(event.date, event.end_date, { short: true })}</span>
              <span>{event.bookings?.[0]?.count || 0} bookings</span>
            </div>
            <Link href={`/dashboard/events/${event.id}/edit`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                Edit
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <SortHeader label="Event" field="title" />
              <SortHeader label="Date" field="date" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Bookings" field="bookings" />
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((event: any) => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="font-medium dark:text-white hover:text-lime-600 dark:hover:text-lime-400"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatEventDate(event.date, event.end_date, { includeYear: true })}
                </td>
                <td className="px-6 py-4">
                  <UIBadge variant={statusStyles[event.status] as any}>{event.status}</UIBadge>
                </td>
                <td className="px-6 py-4 text-sm dark:text-gray-300">
                  {event.bookings?.[0]?.count || 0}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
