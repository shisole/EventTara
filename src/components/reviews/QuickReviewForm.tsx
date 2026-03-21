"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ReviewPhotoUpload from "@/components/reviews/ReviewPhotoUpload";
import ReviewTagSelector from "@/components/reviews/ReviewTagSelector";
import StarRating from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";

interface QuickReviewFormProps {
  eventId: string;
}

export default function QuickReviewForm({ eventId }: QuickReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          text: text.trim() || null,
          tags: tags.length > 0 ? tags : undefined,
          photos: photos.length > 0 ? photos : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong" }));
        setError(data.error || "Failed to submit review");
        return;
      }

      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How would you rate this event?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What stood out? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <ReviewTagSelector selected={tags} onChange={setTags} disabled={loading} />
      </div>

      {/* Optional Text */}
      <div>
        <label
          htmlFor="review-text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tell others about your experience{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What made this event great? Any tips for future participants?"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/500</p>
      </div>

      {/* Optional Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add photos <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <ReviewPhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className={cn(
          "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
          rating > 0
            ? "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed",
          loading && "opacity-50 cursor-not-allowed",
        )}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
