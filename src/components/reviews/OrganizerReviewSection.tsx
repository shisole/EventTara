"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { OrganizerReviewsResponse } from "@/lib/types/organizer-reviews";

import OrganizerReviewForm from "./OrganizerReviewForm";
import OrganizerReviewList from "./OrganizerReviewList";

const AuthReviewModal = dynamic(() => import("./AuthReviewModal"), { ssr: false });

interface OrganizerReviewSectionProps {
  organizerId: string;
  organizerName: string;
  initialData: OrganizerReviewsResponse;
  /** Current user info — null if logged out or guest */
  currentUser: { id: string; fullName: string } | null;
  /** Whether the current user is the organizer themselves */
  isOwnProfile: boolean;
  /** ID of the review owned by current user, if any */
  existingReviewId: string | null;
  /** Optional URL to the dedicated reviews page */
  reviewsPageUrl?: string;
}

export default function OrganizerReviewSection({
  organizerId,
  organizerName,
  initialData,
  currentUser,
  isOwnProfile,
  existingReviewId,
  reviewsPageUrl,
}: OrganizerReviewSectionProps) {
  const [data, setData] = useState<OrganizerReviewsResponse>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [myReviewId, setMyReviewId] = useState<string | null>(existingReviewId);
  const [activeUser, setActiveUser] = useState(currentUser);
  const [isGuestUser, setIsGuestUser] = useState(false);

  const router = useRouter();
  const isLoggedIn = !!activeUser;

  const existingReview = myReviewId ? data.reviews.find((r) => r.id === myReviewId) : null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizers/${organizerId}/reviews?page=1&limit=10`);
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const fresh: OrganizerReviewsResponse = await res.json();
        setData(fresh);
        // Find the current user's review in the refreshed data
        // Try by user_id first (non-anonymous), then fall back to existing myReviewId
        if (activeUser) {
          const mine =
            fresh.reviews.find((r) => r.user_id === activeUser.id) ??
            fresh.reviews.find((r) => r.id === myReviewId);
          if (mine) setMyReviewId(mine.id);
        }
      }
    } catch {
      // Silently fail
    }
  }, [organizerId, activeUser, myReviewId]);

  const handleSuccess = useCallback(() => {
    setShowForm(false);
    setFormKey((k) => k + 1);
    // Save localStorage to prevent guest spam
    if (isGuestUser) {
      localStorage.setItem(
        `guestReview_${organizerId}`,
        JSON.stringify({ submitted: true, timestamp: Date.now() }),
      );
    }
    void refresh();
  }, [refresh, isGuestUser, organizerId]);

  const canReview = !isOwnProfile;
  const hasReviewed = !!myReviewId;

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-3">
        <h2 className="text-xl font-heading font-bold text-center">Organizer Reviews</h2>
        {reviewsPageUrl && (
          <Link
            href={reviewsPageUrl}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            See all &rarr;
          </Link>
        )}
      </div>

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
                userName={activeUser?.fullName ?? ""}
                isGuest={isGuestUser}
                onSuccess={handleSuccess}
              />
            </div>
          ) : (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (isLoggedIn) {
                    setShowForm(true);
                  } else {
                    setShowAuthModal(true);
                  }
                }}
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

      {showAuthModal && (
        <AuthReviewModal
          organizerId={organizerId}
          organizerName={organizerName}
          onAuthenticated={(user) => {
            setActiveUser(user);
            setIsGuestUser(!!user.isGuest);
            setShowAuthModal(false);
            setShowForm(true);
            router.refresh();
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
