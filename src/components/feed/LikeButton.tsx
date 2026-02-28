"use client";

import { useState } from "react";

import type { ActivityType } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  activityType: ActivityType;
  activityId: string;
  likeCount: number;
  isLiked: boolean;
  isAuthenticated: boolean;
}

export default function LikeButton({
  activityType,
  activityId,
  likeCount: initialCount,
  isLiked: initialIsLiked,
  isAuthenticated,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      globalThis.location.href = "/login";
      return;
    }
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/reactions", {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, activityId }),
      });

      if (res.ok) {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
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
      <span
        className={cn(
          "text-xl transition-transform group-active:scale-125",
          isLiked ? "scale-110" : "grayscale opacity-50",
        )}
      >
        {isLiked ? "❤️" : "🤍"}
      </span>
      {likeCount > 0 && (
        <span
          className={cn(
            "text-sm font-medium",
            isLiked ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {likeCount}
        </span>
      )}
    </button>
  );
}
