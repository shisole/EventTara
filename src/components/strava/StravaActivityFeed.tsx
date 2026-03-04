"use client";

import { useCallback, useEffect, useState } from "react";

import { StravaIcon } from "@/components/icons";

import StravaActivityCard, { type StravaActivityData } from "./StravaActivityCard";

interface StravaActivityFeedProps {
  /** The user whose activities to fetch (must be the authenticated user) */
  userId: string;
}

export default function StravaActivityFeed({ userId }: StravaActivityFeedProps) {
  // userId is used to key the component — if it changes, we re-fetch
  const [activities, setActivities] = useState<StravaActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/activities");
      if (!res.ok) {
        if (res.status === 400) {
          // Strava not connected — don't show error, just empty
          setActivities([]);
          return;
        }
        throw new Error("Failed to fetch activities");
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- fetch .json() returns any
      const data: { activities: StravaActivityData[] } = await res.json();
      // Limit to 5 most recent
      setActivities(data.activities.slice(0, 5));
    } catch {
      setError("Could not load recent Strava activities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities, userId]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mt-2" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => void fetchActivities()}
          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
        <StravaIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No recent Strava activities found.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Go for a run, ride, or hike and it will show up here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <StravaActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
