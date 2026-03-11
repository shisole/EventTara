"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SearchIcon } from "@/components/icons";
import { Button, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

const statusStyles: Record<string, string> = {
  draft: "default",
  published: "hiking",
  completed: "running",
  cancelled: "default",
};

type EventStatus = "draft" | "published" | "completed" | "cancelled";
type EventType = "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
type SortKey = "title" | "date" | "status" | "bookings";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS: { value: EventStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "MTB" },
  { value: "road_bike", label: "Road Bike" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Run" },
];

interface EventsTableProps {
  events: any[];
}

export default function EventsTable({ events }: EventsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
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

  const filtered = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter);
    }

    return result;
  }, [events, search, statusFilter, typeFilter]);

  const sorted = useMemo(() => {
    const statusOrder: Record<string, number> = {
      draft: 0,
      published: 1,
      completed: 2,
      cancelled: 3,
    };
    const isActive = (e: any) => e.status === "draft" || e.status === "published";

    if (sortKey === null) {
      return [...filtered].sort((a, b) => {
        const aActive = isActive(a);
        const bActive = isActive(b);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    }

    return [...filtered].sort((a, b) => {
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
  }, [filtered, sortKey, sortDir]);

  const hasFilters = search.trim() || statusFilter !== "all" || typeFilter !== "all";

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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors",
            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-lime-500/40 focus:border-lime-500",
            "dark:text-white",
          )}
        />
      </div>

      {/* Filter pills */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-lime-500 text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                typeFilter === opt.value
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + clear */}
      {hasFilters && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {sorted.length} of {events.length} event{events.length === 1 ? "" : "s"}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <p className="text-gray-500 dark:text-gray-400">
            {hasFilters ? "No events match your filters." : "No events found."}
          </p>
        </div>
      )}

      {/* Mobile: card layout */}
      {sorted.length > 0 && (
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
                <UIBadge variant={statusStyles[event.status]}>{event.status}</UIBadge>
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
      )}

      {/* Desktop: table layout */}
      {sorted.length > 0 && (
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
                    <UIBadge variant={statusStyles[event.status]}>{event.status}</UIBadge>
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
      )}
    </div>
  );
}
