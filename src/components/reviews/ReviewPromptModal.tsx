"use client";

import { useEffect, useState } from "react";

import { CloseIcon } from "@/components/icons";
import ReviewPhotoUpload from "@/components/reviews/ReviewPhotoUpload";
import StarRating from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";

interface ReviewPromptModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function ReviewPromptModal({
  eventId,
  eventTitle,
  onClose,
}: ReviewPromptModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitted) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

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
          photos: photos.length > 0 ? photos : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong" }));
        setError(data.error || "Failed to submit review");
        return;
      }

      setSubmitted(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-end md:items-center justify-center md:p-4 transition-opacity duration-200",
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-modal-title"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full md:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl p-6 md:p-8 max-h-[95dvh] overflow-y-auto transition-all duration-200",
          isVisible
            ? "opacity-100 translate-y-0 md:scale-100"
            : "opacity-0 translate-y-8 md:translate-y-0 md:scale-95",
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-teal-600 dark:text-teal-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              Thanks for your review!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your feedback helps the community.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">&#9733;</span>
              </div>
              <h2
                id="review-prompt-modal-title"
                className="text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                How was the event?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{eventTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Tell others about your experience (optional)"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add photos <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <ReviewPhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
                    rating > 0
                      ? "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed",
                    loading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
