"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import StarRating from "./StarRating";

interface ReviewFormProps {
  eventId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ eventId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ rating, text: text.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSubmitted(true);
        onSubmitted?.();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-lg font-medium text-gray-900 dark:text-white">Thanks for your review!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your feedback helps the community.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How was your experience?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading || rating === 0} size="sm">
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
