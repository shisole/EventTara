"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

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
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} />
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

  // Two-phase slide: "exit" = slide out left, "enter" = slide in from right
  const [slide, setSlide] = useState<"exit" | "enter" | null>(null);

  // Cache: keyed by tab key, stores fetched events
  const cache = useRef<Record<string, EventCardData[]>>({ [initialTab]: initialEvents });

  // Current events for the active tab
  const events = cache.current[activeTab] ?? [];
  const pages = totalPages(events);
  const pageEvents = getPageEvents(events, currentPage);

  // Touch swipe refs (desktop bento)
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // -------------------------------------------------------------------------
  // Shared slide helper: exit left → swap content → enter from right
  // -------------------------------------------------------------------------

  const slideTransition = useCallback(
    (onSwap: () => void) => {
      if (animating) return;
      setAnimating(true);

      // Phase 1: slide out to the left
      setSlide("exit");

      setTimeout(() => {
        // Phase 2: swap content while off-screen, position at right
        onSwap();
        setSlide("enter");

        // Force a frame so the browser paints at translate-x-[105%] before transitioning
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Phase 3: slide in from the right
            setSlide(null);
            setTimeout(() => {
              setAnimating(false);
            }, 300);
          });
        });
      }, 300);
    },
    [animating],
  );

  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------

  const handleTabClick = useCallback(
    (tabKey: string) => {
      if (tabKey === activeTab || animating) return;

      const needsFetch = !cache.current[tabKey];

      if (needsFetch) {
        // Slide out → slide in skeleton → cards replace skeleton in place
        slideTransition(() => {
          setActiveTab(tabKey);
          setCurrentPage(0);
          setLoading(true);
        });

        const tab = TABS.find((t) => t.key === tabKey);
        if (tab) {
          fetch(`/api/events?${tab.param}&limit=10`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed to fetch");
              return res.json();
            })
            .then((data) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawEvents: any[] = Array.isArray(data.events) ? data.events : [];
              cache.current[tabKey] = rawEvents.map((e) => mapApiEventToCard(e));
            })
            .catch(() => {
              cache.current[tabKey] = [];
            })
            .finally(() => {
              // Just reveal the cards — no second slide
              setLoading(false);
            });
        }
      } else {
        // Cached: smooth slide exit → swap → slide enter
        slideTransition(() => {
          setActiveTab(tabKey);
          setCurrentPage(0);
        });
      }
    },
    [activeTab, animating, slideTransition],
  );

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  const goToPage = useCallback(
    (direction: "prev" | "next") => {
      if (animating || pages <= 1) return;

      const nextPage =
        direction === "next" ? (currentPage + 1) % pages : (currentPage - 1 + pages) % pages;

      slideTransition(() => {
        setCurrentPage(nextPage);
      });
    },
    [animating, currentPage, pages, slideTransition],
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? activeTab;

  return (
    <div className="overflow-hidden">
      {/* Tab bar + arrows row (desktop only) */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  handleTabClick(tab.key);
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

      {/* Loading state — slides in with content, cards replace in place */}
      {loading && (
        <div
          className={cn(
            slide === "enter"
              ? "translate-x-[105%]"
              : slide === "exit"
                ? "-translate-x-[105%] transition-transform duration-300 ease-in-out"
                : "translate-x-0 transition-transform duration-300 ease-in-out",
          )}
        >
          <div className="hidden md:block">
            <BentoSkeleton />
          </div>
          <div className="md:hidden">
            <MobileSkeleton />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-16 text-center",
            slide === "enter"
              ? "translate-x-[105%]"
              : slide === "exit"
                ? "-translate-x-[105%] transition-transform duration-300 ease-in-out"
                : "translate-x-0 transition-transform duration-300 ease-in-out",
          )}
        >
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
              slide === "enter"
                ? "translate-x-[105%]"
                : slide === "exit"
                  ? "-translate-x-[105%] transition-transform duration-300 ease-in-out"
                  : "translate-x-0 transition-transform duration-300 ease-in-out",
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
                    if (i !== currentPage && !animating) {
                      slideTransition(() => setCurrentPage(i));
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

      {/* Mobile: static vertical stack of 3 upcoming + view all link */}
      {initialEvents.length > 0 && (
        <div className="flex flex-col gap-4 md:hidden">
          {initialEvents.slice(0, 3).map((event) => (
            <BentoEventCard key={event.id} event={event} variant="small" />
          ))}
          <Link
            href="/events?when=upcoming"
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-lime-500 dark:hover:border-lime-500 transition-colors min-h-[120px]"
          >
            <span className="text-gray-600 dark:text-gray-300 font-heading font-bold">
              View all upcoming
            </span>
            <span className="text-lime-600 dark:text-lime-400 mt-1 text-sm font-medium">
              events &rarr;
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
