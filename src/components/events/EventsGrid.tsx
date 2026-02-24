"use client";

import { useState, useCallback, useMemo } from "react";

import { haversineDistance } from "@/lib/utils/geo";

import EventCard from "./EventCard";
import NearbySort from "./NearbySort";

interface EventData {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
  max_participants: number;
  booking_count: number;
  status: "upcoming" | "happening_now" | "past";
  organizer_name?: string;
  organizer_id?: string;
  coordinates?: { lat: number; lng: number } | null;
  avg_rating?: number;
  review_count?: number;
}

interface EventsGridProps {
  events: EventData[];
}

interface NearbyState {
  active: boolean;
  lat: number;
  lng: number;
}

export default function EventsGrid({ events }: EventsGridProps) {
  const [nearbyState, setNearbyState] = useState<NearbyState | null>(null);

  const handleLocationChange = useCallback((state: NearbyState | null) => {
    setNearbyState(state);
  }, []);

  const eventsWithDistance = useMemo(() => {
    if (!nearbyState)
      return events.map((e) => ({ ...e, distance: undefined as number | undefined }));

    return events
      .map((e) => {
        const coords = e.coordinates;
        const distance =
          coords && typeof coords === "object" && "lat" in coords
            ? haversineDistance(nearbyState.lat, nearbyState.lng, coords.lat, coords.lng)
            : undefined;
        return { ...e, distance };
      })
      .sort((a, b) => {
        // Events with distance come first, sorted by distance
        if (a.distance != null && b.distance != null) return a.distance - b.distance;
        if (a.distance != null) return -1;
        if (b.distance != null) return 1;
        return 0;
      });
  }, [events, nearbyState]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <NearbySort onLocationChange={handleLocationChange} active={!!nearbyState} />
        {nearbyState && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Sorted by distance from you
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsWithDistance.map((event, i) => (
          <div
            key={event.id}
            className="opacity-0 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <EventCard
              id={event.id}
              title={event.title}
              type={event.type}
              date={event.date}
              location={event.location}
              price={event.price}
              cover_image_url={event.cover_image_url}
              max_participants={event.max_participants}
              booking_count={event.booking_count}
              status={event.status}
              organizer_name={event.organizer_name}
              organizer_id={event.organizer_id}
              distance={event.distance}
              avg_rating={event.avg_rating}
              review_count={event.review_count}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
