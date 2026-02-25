"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

import { SkeletonEventCard } from "@/components/ui";

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
  difficulty_level?: number | null;
}

export interface UserResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface EventsApiResponse {
  events: EventData[];
  totalCount: number;
  users?: UserResult[];
}

interface EventsListClientProps {
  initialEvents: EventData[];
  totalCount: number;
  isFiltering?: boolean;
  initialUsers?: UserResult[];
}

export default function EventsListClient({
  initialEvents,
  totalCount,
  isFiltering,
  initialUsers = [],
}: EventsListClientProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [users, setUsers] = useState<UserResult[]>(initialUsers);
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
    setUsers(initialUsers);
    setLoadedCount(initialEvents.length);
    setHasMore(initialEvents.length < Math.min(totalCount, MAX_INFINITE));
  }, [initialEvents, initialUsers, totalCount]);

  const buildApiUrl = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("offset", String(offset));
      params.set("limit", String(BATCH_SIZE));
      const type = searchParams.get("type");
      const when = searchParams.get("when");
      const search = searchParams.get("search");
      const org = searchParams.get("org");
      const guide = searchParams.get("guide");
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const distance = searchParams.get("distance");
      const difficulty = searchParams.get("difficulty");
      if (type) params.set("type", type);
      if (when) params.set("when", when);
      if (search) params.set("search", search);
      if (org) params.set("org", org);
      if (guide) params.set("guide", guide);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (distance) params.set("distance", distance);
      if (difficulty) params.set("difficulty", difficulty);
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
      const data: EventsApiResponse = await res.json();
      const newEvents = data.events;

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
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const handlePageChange = async (page: number) => {
    if (page === currentPage) return;

    setCurrentPage(page);
    setIsLoadingMore(true);

    const offset = (page - 1) * MAX_INFINITE;
    try {
      const res = await fetch(buildApiUrl(offset));
      const data: EventsApiResponse = await res.json();
      const newEvents = data.events;

      setEvents(newEvents);
      setUsers(data.users ?? []);
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

  if (isFiltering) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </div>
    );
  }

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
      {users.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">People</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-lime-400 dark:hover:border-lime-600 transition-colors min-w-[200px] shrink-0"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-sm font-bold text-lime-700 dark:text-lime-400">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
                onClick={() => handlePageChange(page)}
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
