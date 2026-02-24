"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  users: {
    full_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 8;

export default function ReviewList({
  reviews,
  averageRating,
  pageSize = PAGE_SIZE_DEFAULT,
}: ReviewListProps) {
  const [visible, setVisible] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMore = visible < reviews.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    // Small delay to show loader
    setTimeout(() => {
      setVisible((prev) => Math.min(prev + pageSize, reviews.length));
      setLoading(false);
    }, 400);
  }, [hasMore, loading, pageSize, reviews.length]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (reviews.length === 0) return null;

  const avg = averageRating ?? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const displayed = reviews.slice(0, visible);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StarRating value={Math.round(avg)} readonly size="md" />
        <span className="font-bold text-gray-900 dark:text-white">{avg.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
        </span>
      </div>
      <div className="space-y-4">
        {displayed.map((review) => {
          const user = review.users;
          return (
            <div
              key={review.id}
              className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {user.username ? (
                    <Link
                      href={`/profile/${user.username}`}
                      className="text-sm font-medium hover:text-lime-600 dark:hover:text-lime-400"
                    >
                      {user.full_name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{user.full_name}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {review.text && (
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{review.text}</p>
              )}
            </div>
          );
        })}
      </div>

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
