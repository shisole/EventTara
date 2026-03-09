"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { REVIEW_TAGS } from "@/lib/constants/review-tags";
import { type ClubReviewsResponse, type ClubReviewWithUser } from "@/lib/types/club-reviews";
import { cn } from "@/lib/utils";

import ClubReviewCard from "./ClubReviewCard";
import StarRating from "./StarRating";

interface ClubReviewListProps {
  clubSlug: string;
  initialData: ClubReviewsResponse;
}

const TAG_MAP = new Map(REVIEW_TAGS.map((t) => [t.key, t]));

export default function ClubReviewList({ clubSlug, initialData }: ClubReviewListProps) {
  const [reviews, setReviews] = useState<ClubReviewWithUser[]>(initialData.reviews);
  const [page, setPage] = useState(initialData.page);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { averageRating, totalReviews, tagCounts } = initialData;

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/reviews?page=${page + 1}&limit=10`);
      if (!res.ok) throw new Error("Failed to load");
      const data: ClubReviewsResponse = await res.json();

      setReviews((prev) => [...prev, ...data.reviews]);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch {
      // Silently fail — user can scroll again
    } finally {
      setLoading(false);
    }
  }, [clubSlug, page, hasMore, loading]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (totalReviews === 0) return null;

  // Top tag counts (show top 5)
  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <StarRating value={Math.round(averageRating)} readonly size="md" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({totalReviews} review{totalReviews === 1 ? "" : "s"})
          </span>
        </div>

        {/* Tag distribution */}
        {sortedTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {sortedTags.map(([key, count]) => {
              const tag = TAG_MAP.get(key);
              if (!tag) return null;
              return (
                <span
                  key={key}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    tag.sentiment === "positive"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  )}
                >
                  {tag.label} ({count})
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ClubReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Infinite scroll loader */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading more reviews...
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Scroll for more</span>
          )}
        </div>
      )}
    </div>
  );
}
