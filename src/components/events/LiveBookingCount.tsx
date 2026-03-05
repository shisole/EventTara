"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LiveBookingCountProps {
  eventId: string;
  maxParticipants: number;
  initialCount: number;
}

export default function LiveBookingCount({
  eventId,
  maxParticipants,
  initialCount,
}: LiveBookingCountProps) {
  const [bookingCount, setBookingCount] = useState(initialCount);
  const spotsLeft = maxParticipants - bookingCount;

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to booking changes for this event
    const channel = supabase
      .channel(`bookings-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Re-fetch total participants on any booking change
          void supabase.rpc("get_total_participants", { p_event_id: eventId }).then(({ data }) => {
            if (data != null) setBookingCount(data);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId]);

  return (
    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
      <span className="font-medium text-gray-700 dark:text-gray-300">{bookingCount}</span>{" "}
      adventurer{bookingCount === 1 ? "" : "s"} joined
      {" \u00B7 "}
      <span className={cn(spotsLeft <= 5 && "text-red-500 font-medium")}>
        {spotsLeft <= 0 ? "Fully booked" : `${spotsLeft} spots left`}
      </span>
    </div>
  );
}
