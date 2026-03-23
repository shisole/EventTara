"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

import { MediaLightbox, UserAvatar } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";

import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

interface ReviewPhoto {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Review {
  id: string;
  user_id?: string;
  rating: number;
  text: string | null;
  tags?: string[] | null;
  created_at: string;
  event_review_photos?: ReviewPhoto[];
  users: {
    full_name: string;
    avatar_url: string | null;
    username: string | null;
    active_border_id?: string | null;
    active_border_tier?: BorderTier | null;
    active_border_color?: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
  pageSize?: number;
  currentUserId?: string;
  eventId?: string;
}

const PAGE_SIZE_DEFAULT = 8;

export default function ReviewList({
  reviews,
  averageRating,
  pageSize = PAGE_SIZE_DEFAULT,
  currentUserId,
  eventId,
}: ReviewListProps) {
  const [visible, setVisible] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: ReviewPhoto[]; index: number } | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
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
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">No reviews yet.</p>;
  }

  const avg = averageRating ?? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const displayed = reviews.slice(0, visible);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StarRating value={Math.round(avg)} readonly size="md" />
        <span className="font-bold text-gray-900 dark:text-white">{avg.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({reviews.length} review{reviews.length === 1 ? "" : "s"})
        </span>
      </div>
      <div className="space-y-4">
        {displayed.map((review) => {
          const user = review.users;
          const isOwn = currentUserId && review.user_id === currentUserId;
          const isEditing = editingReviewId === review.id;

          if (isEditing && eventId) {
            return (
              <div
                key={review.id}
                className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0"
              >
                <ReviewForm
                  eventId={eventId}
                  reviewId={review.id}
                  initialRating={review.rating}
                  initialText={review.text ?? ""}
                  initialTags={review.tags ?? []}
                  initialPhotos={
                    review.event_review_photos
                      ?.sort((a, b) => a.sort_order - b.sort_order)
                      .map((p) => p.image_url) ?? []
                  }
                  onCancel={() => setEditingReviewId(null)}
                  onSubmitted={() => setEditingReviewId(null)}
                />
              </div>
            );
          }

          return (
            <div
              key={review.id}
              className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0"
            >
              <div className="flex items-center gap-3 mb-2">
                <UserAvatar
                  src={user.avatar_url}
                  alt={user.full_name}
                  size="sm"
                  borderTier={user.active_border_tier ?? null}
                  borderColor={user.active_border_color ?? null}
                />
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
                {isOwn && (
                  <button
                    onClick={() => setEditingReviewId(review.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Edit review"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {review.text && (
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{review.text}</p>
              )}
              {review.event_review_photos && review.event_review_photos.length > 0 && (
                <div className="flex gap-2 ml-11 mt-2">
                  {review.event_review_photos
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() =>
                          setLightbox({ photos: review.event_review_photos!, index: idx })
                        }
                        className="relative w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={photo.image_url}
                          alt="Review photo"
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                </div>
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

      {lightbox && (
        <MediaLightbox
          items={lightbox.photos
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((p) => ({ id: p.id, url: p.image_url, caption: null }))}
          selectedIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : null))}
        />
      )}
    </div>
  );
}
