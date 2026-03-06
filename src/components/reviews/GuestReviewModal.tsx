"use client";

import { useState } from "react";

import { CheckCircleIcon, CloseIcon, EnvelopeIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface GuestReviewModalProps {
  organizerId: string;
  organizerName: string;
  onSubmitted: () => void;
  onClose: () => void;
}

export default function GuestReviewModal({
  organizerId,
  organizerName,
  onSubmitted,
  onClose,
}: GuestReviewModalProps) {
  const [state, setState] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (!isAnonymous && !name.trim()) {
      setError("Please enter your name or select 'Post as Anonymous'.");
      return;
    }

    // Check localStorage for duplicate
    const storageKey = `guestReview_${organizerId}`;
    if (localStorage.getItem(storageKey)) {
      setError("You've already reviewed this organizer.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Get current user (should be anonymous auth user)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Unable to submit review. Please try again.");
        return;
      }

      // Submit review
      const { error: submitError } = await supabase.from("organizer_reviews").insert({
        organizer_id: organizerId,
        user_id: user.id,
        rating,
        text: text.trim() || null,
        is_anonymous: isAnonymous,
      });

      if (submitError) {
        const errorMsg = submitError.message ?? "Failed to submit review. Please try again.";
        if (errorMsg.includes("duplicate")) {
          setError("You've already reviewed this organizer.");
        } else {
          setError(errorMsg);
        }
        return;
      }

      // Mark in localStorage to prevent re-submission
      localStorage.setItem(storageKey, JSON.stringify({ submitted: true, timestamp: Date.now() }));

      // Success
      setState("success");
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onSubmitted, 200);
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-review-modal-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {state !== "success" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}

        {state === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h2
                id="guest-review-modal-title"
                className="text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                Share your experience
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{organizerName}</p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`text-2xl transition-colors ${
                      rating >= r ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Name or Anonymous */}
            <div className="space-y-3">
              {!isAnonymous && (
                <div>
                  <label
                    htmlFor="guest-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Your name (optional)
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={inputClassName}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) setName("");
                  }}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Post as Anonymous</span>
              </label>
            </div>

            {/* Review Text */}
            <div>
              <label
                htmlFor="guest-text"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Your review (optional)
              </label>
              <textarea
                id="guest-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1000))}
                placeholder="Share your feedback..."
                maxLength={1000}
                className={`${inputClassName} resize-none h-24`}
              />
              <p className="text-xs text-gray-400 mt-1">{text.length}/1000</p>
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || rating === 0}>
              {loading ? "Submitting..." : "Submit Review"}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              No account needed. One review per event.
            </p>
          </form>
        )}

        {state === "success" && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              Thank you!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your review has been submitted and will help other adventurers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
