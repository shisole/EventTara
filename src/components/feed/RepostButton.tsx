"use client";

import { useState } from "react";

import { RepostIcon } from "@/components/icons";
import type { ActivityType } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

interface RepostButtonProps {
  activityType: ActivityType;
  activityId: string;
  repostCount: number;
  isReposted: boolean;
  isAuthenticated: boolean;
}

export default function RepostButton({
  activityType,
  activityId,
  repostCount: initialCount,
  isReposted: initialIsReposted,
  isAuthenticated,
}: RepostButtonProps) {
  const [isReposted, setIsReposted] = useState(initialIsReposted);
  const [repostCount, setRepostCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      globalThis.location.href = "/login";
      return;
    }
    if (loading) return;

    // Optimistic update
    const wasReposted = isReposted;
    setIsReposted(!wasReposted);
    setRepostCount((prev) => (wasReposted ? prev - 1 : prev + 1));
    setLoading(true);

    try {
      const res = await fetch("/api/feed/reposts", {
        method: wasReposted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, activityId }),
      });

      if (!res.ok) {
        // Revert on failure
        setIsReposted(wasReposted);
        setRepostCount((prev) => (wasReposted ? prev + 1 : prev - 1));
      }
    } catch {
      // Revert on network error
      setIsReposted(wasReposted);
      setRepostCount((prev) => (wasReposted ? prev + 1 : prev - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 group"
    >
      <RepostIcon
        className={cn(
          "w-5 h-5 transition-transform group-active:scale-125",
          isReposted ? "text-teal-600 dark:text-teal-400" : "text-gray-400 dark:text-gray-500",
        )}
      />
      {repostCount > 0 && (
        <span
          className={cn(
            "text-sm font-medium",
            isReposted ? "text-teal-600 dark:text-teal-400" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {repostCount}
        </span>
      )}
    </button>
  );
}
