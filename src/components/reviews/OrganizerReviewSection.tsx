"use client";

import { useCallback, useState } from "react";

import type { OrganizerReviewsResponse } from "@/lib/types/organizer-reviews";

import OrganizerReviewForm from "./OrganizerReviewForm";
import OrganizerReviewList from "./OrganizerReviewList";

interface OrganizerReviewSectionProps {
  organizerId: string;
  initialData: OrganizerReviewsResponse;
  /** Current user info — null if logged out or guest */
  currentUser: { id: string; fullName: string } | null;
  /** Whether the current user is the organizer themselves */
  isOwnProfile: boolean;
  /** ID of the review owned by current user, if any */
  existingReviewId: string | null;
}

export default function OrganizerReviewSection({
  organizerId,
  initialData,
  currentUser,
  isOwnProfile,
  existingReviewId,
}: OrganizerReviewSectionProps) {
  const [data, setData] = useState<OrganizerReviewsResponse>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const existingReview = existingReviewId
    ? data.reviews.find((r) => r.id === existingReviewId)
    : null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizers/${organizerId}/reviews?page=1&limit=10`);
      if (res.ok) {
        const fresh: OrganizerReviewsResponse = await res.json();
        setData(fresh);
      }
    } catch {
      // Silently fail
    }
  }, [organizerId]);

  const handleSuccess = useCallback(() => {
    setShowForm(false);
    setFormKey((k) => k + 1);
    void refresh();
  }, [refresh]);

  const canReview = !!currentUser && !isOwnProfile;
  const hasReviewed = !!existingReviewId;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4 text-center">Organizer Reviews</h2>

      {/* Write / Edit review */}
      {canReview && (
        <div className="mb-6">
          {showForm ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {hasReviewed ? "Edit Your Review" : "Write a Review"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
              <OrganizerReviewForm
                key={formKey}
                organizerId={organizerId}
                existingReview={existingReview ?? undefined}
                userName={currentUser.fullName}
                onSuccess={handleSuccess}
              />
            </div>
          ) : (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                {hasReviewed ? "Edit Your Review" : "Write a Review"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review list */}
      {data.totalReviews > 0 ? (
        <OrganizerReviewList organizerId={organizerId} initialData={data} />
      ) : (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">&#x2B50;</p>
          <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
