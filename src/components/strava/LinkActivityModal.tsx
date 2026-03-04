"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

import StravaActivityCard, { type StravaActivityData } from "./StravaActivityCard";

interface LinkActivityModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called after an activity is successfully linked */
  onLinked: () => void;
}

export default function LinkActivityModal({
  bookingId,
  isOpen,
  onClose,
  onLinked,
}: LinkActivityModalProps) {
  const [activities, setActivities] = useState<StravaActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<number | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/activities");
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to fetch activities");
      }
      const data: { activities: StravaActivityData[] } = await res.json();
      setActivities(data.activities);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to load activities";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch activities when modal opens
  useEffect(() => {
    if (isOpen) {
      void fetchActivities();
    }
  }, [isOpen, fetchActivities]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSelect = async (activity: StravaActivityData) => {
    setLinkingId(activity.id);
    setError(null);
    try {
      const res = await fetch("/api/strava/activities/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strava_activity_id: activity.id,
          booking_id: bookingId,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Failed to link activity");
      }

      onLinked();
      onClose();
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to link activity";
      setError(message);
    } finally {
      setLinkingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-activity-title"
    >
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg",
          "max-h-[80vh] overflow-hidden flex flex-col",
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2
            id="link-activity-title"
            className="text-lg font-heading font-bold text-gray-900 dark:text-white"
          >
            Link Strava Activity
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-6">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void fetchActivities()}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && activities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent Strava activities found.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Complete an activity on Strava and try again.
              </p>
            </div>
          )}

          {/* Activity list */}
          {!loading &&
            activities.map((activity) => (
              <StravaActivityCard
                key={activity.id}
                activity={activity}
                onSelect={() => void handleSelect(activity)}
                linking={linkingId === activity.id}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
