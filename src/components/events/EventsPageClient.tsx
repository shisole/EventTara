"use client";

import { useState, useCallback } from "react";

import EventFilters from "@/components/events/EventFilters";
import type { NearbyState } from "@/components/events/EventsGrid";
import EventsListClient, {
  type EventData,
  type UserResult,
} from "@/components/events/EventsListClient";
import NearbySort from "@/components/events/NearbySort";

interface FilterOption {
  id: string;
  name: string;
}

interface EventsPageClientProps {
  initialEvents: EventData[];
  totalCount: number;
  organizers: FilterOption[];
  guides: FilterOption[];
  initialUsers?: UserResult[];
}

export default function EventsPageClient({
  initialEvents,
  totalCount,
  organizers,
  guides,
  initialUsers = [],
}: EventsPageClientProps) {
  const [isFiltering, setIsFiltering] = useState(false);
  const [nearbyState, setNearbyState] = useState<NearbyState | null>(null);

  const handleLocationChange = useCallback((state: NearbyState | null) => {
    setNearbyState(state);
  }, []);

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-3 sm:mb-4">Explore Events</h1>

      {/* Sticky filter bar on mobile — no backdrop-blur (it creates a containing
           block that breaks fixed-position bottom sheets inside FilterChips) */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:z-auto bg-white dark:bg-gray-900 sm:bg-transparent sm:dark:bg-transparent pb-3 sm:pb-0 mb-4 sm:mb-8">
        <EventFilters organizers={organizers} guides={guides} onPendingChange={setIsFiltering} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount} {totalCount === 1 ? "result" : "results"} found
        </p>
        <div className="flex items-center gap-2">
          <NearbySort onLocationChange={handleLocationChange} active={!!nearbyState} />
          {nearbyState && (
            <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
              Sorted by distance
            </span>
          )}
        </div>
      </div>

      <EventsListClient
        initialEvents={initialEvents}
        totalCount={totalCount}
        isFiltering={isFiltering}
        initialUsers={initialUsers}
        nearbyState={nearbyState}
      />
    </>
  );
}
