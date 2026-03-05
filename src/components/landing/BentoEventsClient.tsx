"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { type EventCardData } from "@/lib/events/map-event-card";
import { cn } from "@/lib/utils";

import BentoEventCard from "./BentoEventCard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { key: "featured", label: "Featured", param: "featured=true" },
  { key: "upcoming", label: "Upcoming", param: "when=upcoming" },
  { key: "hiking", label: "Hiking", param: "type=hiking" },
  { key: "mtb", label: "Mountain Biking", param: "type=mtb" },
  { key: "road_bike", label: "Road Biking", param: "type=road_bike" },
  { key: "running", label: "Running", param: "type=running" },
  { key: "trail_run", label: "Trail Running", param: "type=trail_run" },
] as const;

const CARDS_PER_PAGE = 5;
const MAX_PAGES = 2;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BentoEventsClientProps {
  initialEvents: EventCardData[];
  initialTab: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiEventToCard(e: any): EventCardData {
  const rawDistances: { distance_km?: number }[] = Array.isArray(e.distances) ? e.distances : [];

  const card: EventCardData = {
    id: String(e.id ?? ""),
    title: String(e.title ?? ""),
    type: String(e.type ?? ""),
    date: String(e.date ?? ""),
    endDate: e.endDate ?? e.end_date ?? null,
    location: String(e.location ?? ""),
    price: Number(e.price ?? 0),
    cover_image_url: e.cover_image_url ?? null,
    max_participants: Number(e.max_participants ?? 0),
    booking_count: Number(e.booking_count ?? 0),
    status: e.status ?? "upcoming",
    organizer_name: e.organizer_name ?? undefined,
    organizer_id: e.organizer_id ?? undefined,
    coordinates: e.coordinates ?? null,
    avg_rating: e.avg_rating == null ? undefined : Number(e.avg_rating),
    review_count: e.review_count == null ? undefined : Number(e.review_count),
    difficulty_level: e.difficulty_level ?? null,
    race_distances: rawDistances.map((d) => d.distance_km ?? 0),
    hasRoute: Boolean(e.hasRoute ?? false),
    is_featured: Boolean(e.is_featured ?? false),
  };
  return card;
}

function totalPages(events: EventCardData[]): number {
  return Math.min(MAX_PAGES, Math.max(1, Math.ceil(events.length / CARDS_PER_PAGE)));
}

function getPageEvents(events: EventCardData[], page: number): EventCardData[] {
  const start = page * CARDS_PER_PAGE;
  return events.slice(start, start + CARDS_PER_PAGE);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard({ large }: { large?: boolean }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden",
        large ? "h-full min-h-[380px]" : "aspect-[16/10]",
      )}
    >
      <div className={cn("bg-gray-200 dark:bg-gray-700", large ? "h-2/3" : "h-3/5")} />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        {large && <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />}
      </div>
    </div>
  );
}

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 min-h-[380px]">
      <div className="col-span-1 row-span-2">
        <SkeletonCard large />
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden pb-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="shrink-0 w-[280px]">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BentoEventsClient({ initialEvents, initialTab }: BentoEventsClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Cache: keyed by tab key, stores fetched events
  const cache = useRef<Record<string, EventCardData[]>>({ [initialTab]: initialEvents });

  // Current events for the active tab
  const events = cache.current[activeTab] ?? [];
  const pages = totalPages(events);
  const pageEvents = getPageEvents(events, currentPage);

  // Mobile swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------

  const handleTabClick = useCallback(
    async (tabKey: string) => {
      if (tabKey === activeTab) return;

      setActiveTab(tabKey);
      setCurrentPage(0);
      setSlideDirection(null);

      // Already cached
      if (cache.current[tabKey]) return;

      const tab = TABS.find((t) => t.key === tabKey);
      if (!tab) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/events?${tab.param}&limit=10`);
        if (!res.ok) throw new Error("Failed to fetch");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawEvents: any[] = Array.isArray(data.events) ? data.events : [];
        const cards: EventCardData[] = rawEvents.map((e) => mapApiEventToCard(e));

        cache.current[tabKey] = cards;
      } catch {
        cache.current[tabKey] = [];
      } finally {
        setLoading(false);
      }
    },
    [activeTab],
  );

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  const goToPage = useCallback(
    (direction: "prev" | "next") => {
      if (animating || pages <= 1) return;

      // Wrap around: next from last page → page 0, prev from page 0 → last page
      const nextPage =
        direction === "next" ? (currentPage + 1) % pages : (currentPage - 1 + pages) % pages;

      setSlideDirection(direction === "next" ? "left" : "right");
      setAnimating(true);

      // After slide-out completes, swap page and slide-in
      setTimeout(() => {
        setCurrentPage(nextPage);
        setSlideDirection(null);
        setAnimating(false);
      }, 300);
    },
    [animating, currentPage, pages],
  );

  // -------------------------------------------------------------------------
  // Touch / swipe support (desktop bento)
  // -------------------------------------------------------------------------

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        goToPage(diff > 0 ? "next" : "prev");
      }
    },
    [goToPage],
  );

  // Reset page when events change (e.g. after fetch)
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? activeTab;

  return (
    <div>
      {/* Tab bar + arrows row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  void handleTabClick(tab.key);
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-lime-500 text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Arrow buttons — only desktop, only when multiple pages */}
        {pages > 1 && !loading && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => goToPage("prev")}
              className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="Previous page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              onClick={() => goToPage("next")}
              className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="Next page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <>
          <div className="hidden md:block">
            <BentoSkeleton />
          </div>
          <div className="md:hidden">
            <MobileSkeleton />
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-3">No {tabLabel} events right now</p>
          <Link
            href="/events"
            className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
          >
            Browse all events
          </Link>
        </div>
      )}

      {/* Desktop: Bento grid */}
      {!loading && events.length > 0 && (
        <div
          className="hidden md:block overflow-hidden"
          onTouchStart={pages > 1 ? handleTouchStart : undefined}
          onTouchEnd={pages > 1 ? handleTouchEnd : undefined}
        >
          <div
            className={cn(
              "transition-transform duration-300 ease-in-out",
              slideDirection === "left" && "-translate-x-[105%]",
              slideDirection === "right" && "translate-x-[105%]",
              !slideDirection && "translate-x-0",
            )}
          >
            {pageEvents.length > 0 && (
              <div className="grid grid-cols-3 grid-rows-2 gap-4 min-h-[380px]">
                {/* Large featured card */}
                <div className="col-span-1 row-span-2">
                  <BentoEventCard event={pageEvents[0]} variant="large" />
                </div>

                {/* Up to 4 small cards */}
                {pageEvents.slice(1, 5).map((event) => (
                  <div key={event.id}>
                    <BentoEventCard event={event} variant="small" />
                  </div>
                ))}

                {/* Fill empty cells if < 5 events on this page */}
                {pageEvents.length < 5 &&
                  Array.from({ length: 5 - pageEvents.length - 1 }, (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 aspect-[16/10]"
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Page dots */}
          {pages > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i !== currentPage) {
                      setSlideDirection(i > currentPage ? "left" : "right");
                      setAnimating(true);
                      setTimeout(() => {
                        setCurrentPage(i);
                        setSlideDirection(null);
                        setAnimating(false);
                      }, 300);
                    }
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === currentPage ? "w-6 bg-lime-500" : "w-1.5 bg-gray-300 dark:bg-gray-600",
                  )}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile: horizontal scroll carousel */}
      {!loading && events.length > 0 && (
        <div className="md:hidden">
          <div
            ref={mobileScrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                className="shrink-0 w-[280px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <BentoEventCard event={event} variant="small" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
