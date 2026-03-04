"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import StravaIcon from "@/components/icons/StravaIcon";
import { Button } from "@/components/ui";

const LinkActivityModal = dynamic(() => import("./LinkActivityModal"));

/** Shape of a linked Strava activity passed from the server */
export interface LinkedStravaActivity {
  id: string;
  name: string;
  distance: number;
  movingTime: number;
  totalElevationGain: number;
  matchedAutomatically: boolean;
}

interface StravaActivitySectionProps {
  bookingId: string;
  linkedActivity: LinkedStravaActivity | null;
  hasStravaConnected: boolean;
  checkedIn: boolean;
}

/** Format meters to km (e.g., 12345 -> "12.35 km") */
function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Format seconds to Xh Ym (e.g., 3723 -> "1h 2m") */
function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${String(hours)}h ${String(minutes)}m`;
  }
  return `${String(minutes)}m`;
}

export default function StravaActivitySection({
  bookingId,
  linkedActivity: initialActivity,
  hasStravaConnected,
  checkedIn,
}: StravaActivitySectionProps) {
  const [linkedActivity, setLinkedActivity] = useState(initialActivity);
  const [modalOpen, setModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleLinked = useCallback(() => {
    // Reload the page to get fresh server data
    globalThis.location.reload();
  }, []);

  const handleUnlink = useCallback(async () => {
    if (!linkedActivity) return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/strava/activities/${linkedActivity.id}/unlink`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to unlink");
      }
      setLinkedActivity(null);
    } catch (error) {
      console.error("Failed to unlink activity:", error);
    } finally {
      setUnlinking(false);
    }
  }, [linkedActivity]);

  // No Strava connected or not checked in: don't show anything
  if (!hasStravaConnected || !checkedIn) return null;

  // Linked activity: show inline info
  if (linkedActivity) {
    return (
      <div className="mt-3 rounded-xl border border-[#FC4C02]/20 bg-orange-50/50 dark:bg-orange-950/10 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <StravaIcon className="w-4 h-4 text-[#FC4C02] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {linkedActivity.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span>{formatDistance(linkedActivity.distance)}</span>
                <span>{formatMovingTime(linkedActivity.movingTime)}</span>
                <span>{Math.round(linkedActivity.totalElevationGain)}m elev.</span>
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#FC4C02]">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {linkedActivity.matchedAutomatically
                    ? "Auto-verified via Strava"
                    : "Verified via Strava"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleUnlink()}
            disabled={unlinking}
            className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Unlink Strava activity"
          >
            {unlinking ? "..." : "Unlink"}
          </button>
        </div>
      </div>
    );
  }

  // Checked in, Strava connected, but no linked activity: show link button
  return (
    <>
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="!border-[#FC4C02]/30 !text-[#FC4C02] hover:!bg-orange-50 dark:hover:!bg-orange-950/20 gap-1.5"
        >
          <StravaIcon className="w-4 h-4" />
          Link Strava Activity
        </Button>
      </div>
      <LinkActivityModal
        bookingId={bookingId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onLinked={handleLinked}
      />
    </>
  );
}
