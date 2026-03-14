import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getActivityGradientColor,
  getActivityLabel,
  getActivitySolidColor,
} from "@/lib/constants/activity-types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

export default async function EmbedEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, location, cover_image_url, type, price, max_participants, status")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!event) {
    notFound();
  }

  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .in("status", ["confirmed", "pending"]);

  const spotsLeft =
    event.max_participants == null ? null : event.max_participants - (bookingCount ?? 0);

  const eventUrl = `/events/${event.id}`;

  return (
    <div className="w-[400px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Cover image or gradient fallback */}
      <div className="relative h-[100px] w-full">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div
            className={cn("h-full w-full bg-gradient-to-br", getActivityGradientColor(event.type))}
          />
        )}
        {/* Activity type pill */}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            getActivitySolidColor(event.type),
          )}
        >
          {getActivityLabel(event.type)}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h2 className="font-heading truncate text-sm font-bold text-gray-900">{event.title}</h2>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            {formatEventDate(event.date, null, { short: true })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <span className="truncate max-w-[180px]">{event.location}</span>
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600">
          {event.price != null && (
            <span className="font-semibold">
              {event.price === 0 ? "Free" : `₱${event.price.toLocaleString()}`}
            </span>
          )}
          {event.price != null && spotsLeft != null && (
            <span className="text-gray-300" aria-hidden="true">
              &middot;
            </span>
          )}
          {spotsLeft != null && (
            <span className={cn(spotsLeft <= 5 && spotsLeft > 0 && "text-orange-500 font-medium")}>
              {spotsLeft <= 0 ? "Fully booked" : `${spotsLeft} spots left`}
            </span>
          )}
        </div>

        <a
          href={eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Join Event
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
