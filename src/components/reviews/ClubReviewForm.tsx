"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui";
import { MAX_REVIEW_TEXT_LENGTH } from "@/lib/constants/review-tags";
import { type ClubReviewWithUser } from "@/lib/types/club-reviews";
import { cn } from "@/lib/utils";

import ReviewPhotoUpload from "./ReviewPhotoUpload";
import ReviewTagSelector from "./ReviewTagSelector";
import StarRating from "./StarRating";

interface ClubReviewFormProps {
  clubSlug: string;
  /** If provided, the form is in "edit" mode. */
  existingReview?: ClubReviewWithUser;
  userName: string;
  /** If true, the user is a guest (no auth session) */
  isGuest?: boolean;
  onSuccess: () => void;
}

export default function ClubReviewForm({
  clubSlug,
  existingReview,
  userName,
  isGuest = false,
  onSuccess,
}: ClubReviewFormProps) {
  const isEdit = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [text, setText] = useState(existingReview?.text ?? "");
  const [tags, setTags] = useState<string[]>(existingReview?.tags ?? []);
  const [photos, setPhotos] = useState<string[]>(
    existingReview?.photos.map((p) => p.image_url) ?? [],
  );
  const [isAnonymous, setIsAnonymous] = useState(isGuest || existingReview?.is_anonymous || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (rating === 0) {
        setError("Please select a rating");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          rating,
          text: text.trim() || undefined,
          is_anonymous: isGuest ? true : isAnonymous,
          tags,
          photo_urls: photos,
        };
        if (isGuest) {
          body.guest_name = userName;
        }

        const res = await fetch(`/api/clubs/${clubSlug}/reviews`, {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Something went wrong" }));
          throw new Error(data.error || "Failed to submit review");
        }

        onSuccess();
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [rating, text, isAnonymous, isGuest, userName, tags, photos, clubSlug, isEdit, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tags <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <ReviewTagSelector selected={tags} onChange={setTags} disabled={submitting} />
      </div>

      {/* Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Review <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_REVIEW_TEXT_LENGTH}
          rows={3}
          disabled={submitting}
          placeholder="Share your experience with this club..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-teal-500"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {text.length}/{MAX_REVIEW_TEXT_LENGTH}
        </p>
      </div>

      {/* Photos (not available for guests) */}
      {!isGuest && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Photos <span className="text-gray-400 font-normal">(optional, max 5)</span>
          </label>
          <ReviewPhotoUpload photos={photos} onChange={setPhotos} disabled={submitting} />
        </div>
      )}

      {/* Post as: user / anonymous (hidden for guests — always anonymous) */}
      {!isGuest && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Post as
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              disabled={submitting}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                isAnonymous
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  : "bg-teal-100 text-teal-800 ring-1 ring-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:ring-teal-700",
              )}
            >
              {userName}
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(true)}
              disabled={submitting}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                isAnonymous
                  ? "bg-gray-700 text-white ring-1 ring-gray-600 dark:bg-gray-600 dark:ring-gray-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
              )}
            >
              Anonymous
            </button>
          </div>
        </div>
      )}

      {isGuest && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Posting as <span className="font-medium">{userName}</span> (guest)
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || rating === 0} className="w-full">
        {submitting ? "Submitting..." : isEdit ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}
