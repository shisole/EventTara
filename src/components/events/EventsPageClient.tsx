"use client";

import { useState } from "react";

import EventFilters from "@/components/events/EventFilters";
import EventsListClient, { type EventData } from "@/components/events/EventsListClient";

interface FilterOption {
  id: string;
  name: string;
}

interface EventsPageClientProps {
  initialEvents: EventData[];
  totalCount: number;
  organizers: FilterOption[];
  guides: FilterOption[];
}

export default function EventsPageClient({
  initialEvents,
  totalCount,
  organizers,
  guides,
}: EventsPageClientProps) {
  const [isFiltering, setIsFiltering] = useState(false);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-4">Explore Events</h1>
        <EventFilters organizers={organizers} guides={guides} onPendingChange={setIsFiltering} />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {totalCount} {totalCount === 1 ? "result" : "results"} found
      </p>

      <EventsListClient
        initialEvents={initialEvents}
        totalCount={totalCount}
        isFiltering={isFiltering}
      />
    </>
  );
}
