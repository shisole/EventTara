"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import EventsGrid from "./EventsGrid";

const BATCH_SIZE = 9;
const MAX_INFINITE = 30;

export interface EventData {
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

interface EventsListClientProps {
  initialEvents: EventData[];
  totalCount: number;
}

export default function EventsListClient({ initialEvents, totalCount }: EventsListClientProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [loadedCount, setLoadedCount] = useState(initialEvents.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(totalCount / MAX_INFINITE);
  const showPagination = totalCount > MAX_INFINITE;
  const pageOffset = (currentPage - 1) * MAX_INFINITE;

  // Reset when filters change (URL search params) or initial data changes
  useEffect(() => {
    setCurrentPage(1);
    setEvents(initialEvents);
    setLoadedCount(initialEvents.length);
    setHasMore(initialEvents.length < Math.min(totalCount, MAX_INFINITE));
  }, [initialEvents, totalCount]);

  const buildApiUrl = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("offset", String(offset));
      params.set("limit", String(BATCH_SIZE));
      const type = searchParams.get("type");
      const when = searchParams.get("when");
      const search = searchParams.get("search");
      if (type) params.set("type", type);
      if (when) params.set("when", when);
      if (search) params.set("search", search);
      return `/api/events?${params.toString()}`;
    },
    [searchParams],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const nextOffset = pageOffset + loadedCount;
    const maxForPage = Math.min(totalCount - pageOffset, MAX_INFINITE);

    if (loadedCount >= maxForPage) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const res = await fetch(buildApiUrl(nextOffset));
      const data = await res.json();
      const newEvents = data.events as EventData[];

      setEvents((prev) => [...prev, ...newEvents]);
      setLoadedCount((prev) => prev + newEvents.length);

      const newTotal = loadedCount + newEvents.length;
      if (newEvents.length < BATCH_SIZE || newTotal >= maxForPage) {
        setHasMore(false);
      }
    } catch {
      // Silently fail, user can scroll again
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, pageOffset, loadedCount, totalCount, buildApiUrl]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handlePageChange = async (page: number) => {
    if (page === currentPage) return;

    setCurrentPage(page);
    setIsLoadingMore(true);

    const offset = (page - 1) * MAX_INFINITE;
    try {
      const res = await fetch(buildApiUrl(offset));
      const data = await res.json();
      const newEvents = data.events as EventData[];

      setEvents(newEvents);
      setLoadedCount(newEvents.length);

      const maxForPage = Math.min(totalCount - offset, MAX_INFINITE);
      setHasMore(newEvents.length < maxForPage);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingMore(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (events.length === 0 && !isLoadingMore) {
    return (
      <div className="text-center py-20 opacity-0 animate-fade-up">
        <p className="text-5xl mb-4">&#x1F3D4;&#xFE0F;</p>
        <h2 className="text-xl font-heading font-bold text-gray-700 dark:text-gray-300 mb-2">
          No events found
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Check back soon — new adventures are being planned!
        </p>
      </div>
    );
  }

  return (
    <div>
      <EventsGrid events={events} />

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
                />
              </svg>
              <span className="text-sm">Loading more events...</span>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {showPagination && !hasMore && (
        <nav className="flex justify-center items-center gap-1 pt-8 pb-4" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {generatePageNumbers(currentPage, totalPages).map((page, i) =>
            page === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-lime-500 text-gray-900"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
