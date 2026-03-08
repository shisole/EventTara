"use client";

import { useCallback, useEffect, useState } from "react";

import ClubCard from "@/components/clubs/ClubCard";
import { Button, Input, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ClubData {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  activity_types: string[];
  visibility: "public" | "private";
  description: string | null;
  is_demo: boolean;
}

interface ClubGridProps {
  initialClubs: ClubData[];
  initialTotal: number;
  initialMemberCounts: Record<string, number>;
}

const activityFilters = [
  { key: "hiking", label: "Hiking" },
  { key: "mtb", label: "MTB" },
  { key: "road_bike", label: "Road Bike" },
  { key: "running", label: "Running" },
  { key: "trail_run", label: "Trail Run" },
];

const activityPillColors: Record<string, string> = {
  hiking:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-300 dark:ring-emerald-700",
  mtb: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-300 dark:ring-amber-700",
  road_bike:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-blue-300 dark:ring-blue-700",
  running:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 ring-orange-300 dark:ring-orange-700",
  trail_run:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 ring-yellow-300 dark:ring-yellow-700",
};

const LIMIT = 12;

export default function ClubGrid({
  initialClubs,
  initialTotal,
  initialMemberCounts,
}: ClubGridProps) {
  const [clubs, setClubs] = useState(initialClubs);
  const [memberCounts, setMemberCounts] = useState(initialMemberCounts);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchClubs = useCallback(
    async (searchVal: string, activityVal: string, pageVal: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchVal) params.set("search", searchVal);
        if (activityVal) params.set("activity", activityVal);
        params.set("page", String(pageVal));
        params.set("limit", String(LIMIT));

        const res = await fetch(`/api/clubs?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        setClubs(data.clubs);
        setTotal(data.total);

        // Fetch member counts for returned clubs
        const counts: Record<string, number> = {};
        for (const club of data.clubs) {
          counts[club.id] = 0;
        }
        // Use a single batch approach - just count from the existing data
        // The GET /api/clubs doesn't return member counts, so we fetch them individually
        // For performance, we'll batch this in the future
        if (data.clubs.length > 0) {
          const countPromises = data.clubs.map(async (club: ClubData) => {
            try {
              const countRes = await fetch(`/api/clubs/${club.slug}`);
              if (countRes.ok) {
                const detail = await countRes.json();
                return { id: club.id, count: detail.member_count ?? 0 };
              }
            } catch {
              // ignore
            }
            return { id: club.id, count: 0 };
          });
          const results = await Promise.all(countPromises);
          for (const r of results) {
            counts[r.id] = r.count;
          }
        }
        setMemberCounts(counts);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasSearched) return;
    const timer = setTimeout(() => {
      setPage(1);
      void fetchClubs(search, activity, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activity, hasSearched, fetchClubs]);

  const handleSearch = (value: string) => {
    setHasSearched(true);
    setSearch(value);
  };

  const handleActivityToggle = (key: string) => {
    setHasSearched(true);
    setActivity((prev) => (prev === key ? "" : key));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    void fetchClubs(search, activity, newPage);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="!rounded-full !py-2.5 !px-5"
        />
      </div>

      {/* Activity filter pills */}
      <div className="flex flex-wrap gap-2">
        {activityFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleActivityToggle(f.key)}
            className={cn(
              "inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
              activity === f.key
                ? cn("ring-2", activityPillColors[f.key])
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {total} {total === 1 ? "club" : "clubs"} found
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">
            <svg
              className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No clubs found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              slug={club.slug}
              name={club.name}
              logo_url={club.logo_url}
              activity_types={club.activity_types}
              member_count={memberCounts[club.id] ?? 0}
              visibility={club.visibility}
              description={club.description}
              is_demo={club.is_demo}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
