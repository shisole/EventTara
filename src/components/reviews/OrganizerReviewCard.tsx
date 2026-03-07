"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { UserAvatar } from "@/components/ui";
import { REVIEW_TAGS } from "@/lib/constants/review-tags";
import type { OrganizerReviewWithUser } from "@/lib/types/organizer-reviews";
import { cn } from "@/lib/utils";

import ReviewPhotoLightbox from "./ReviewPhotoLightbox";

interface OrganizerReviewCardProps {
  review: OrganizerReviewWithUser;
}

const TAG_MAP = new Map(REVIEW_TAGS.map((t) => [t.key, t]));

export default function OrganizerReviewCard({ review }: OrganizerReviewCardProps) {
  const displayName = review.is_anonymous
    ? review.guest_name || "Anonymous"
    : (review.user?.full_name ?? "User");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 dark:shadow-gray-950/20">
      {/* Header: avatar + name + rating + date */}
      <div className="flex items-center gap-3 mb-3">
        {review.is_anonymous ? (
          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : (
          <UserAvatar
            src={review.user?.avatar_url ?? null}
            alt={displayName}
            size="sm"
            borderTier={null}
            borderColor={null}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!review.is_anonymous && review.user?.username ? (
              <Link
                href={`/profile/${review.user.username}`}
                className="text-sm font-medium hover:text-teal-600 dark:hover:text-teal-400 truncate"
              >
                {displayName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {displayName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 text-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={cn(
                    star <= review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600",
                  )}
                >
                  &#9733;
                </span>
              ))}
            </div>
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

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {review.tags.map((tagKey) => {
            const tag = TAG_MAP.get(tagKey);
            if (!tag) return null;
            return (
              <span
                key={tagKey}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  tag.sentiment === "positive"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                )}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Text */}
      {review.text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{review.text}</p>
      )}

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {review.photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="shrink-0"
            >
              <Image
                src={photo.image_url}
                alt="Review photo"
                width={96}
                height={96}
                className="h-24 w-24 rounded-lg object-cover hover:opacity-80 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {lightboxIndex !== null && (
        <ReviewPhotoLightbox
          photos={review.photos.map((p) => p.image_url)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
