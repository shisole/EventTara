"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const ReviewPromptModal = dynamic(() => import("@/components/reviews/ReviewPromptModal"));

interface SelfCheckinPromptProps {
  eventId: string;
  eventTitle: string;
}

export default function SelfCheckinPrompt({ eventId, eventTitle }: SelfCheckinPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  async function handleCheckin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setShowReviewModal(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (showReviewModal) {
    return (
      <ReviewPromptModal
        eventId={eventId}
        eventTitle={eventTitle}
        onClose={() => setShowReviewModal(false)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-lime-200 dark:border-lime-800 bg-lime-50 dark:bg-lime-950/30 p-5 mb-6">
      <h3 className="font-heading font-bold text-gray-900 dark:text-gray-100 mb-1">
        Were you at this event?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Check in to share your experience and leave a review
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
      <button
        onClick={handleCheckin}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-700 disabled:opacity-50"
      >
        {loading ? "Checking in\u2026" : "Yes, I was there"}
      </button>
    </div>
  );
}
