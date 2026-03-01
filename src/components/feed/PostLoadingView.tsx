"use client";

import { useParams } from "next/navigation";

import PostView from "@/components/feed/PostView";
import { feedCache } from "@/lib/feed/cache";

export default function PostLoadingView() {
  const { id } = useParams<{ id: string }>();
  const cached = feedCache.get(id);

  if (cached) {
    return (
      <PostView
        item={cached.item}
        isAuthenticated={cached.isAuthenticated}
        currentUserId={cached.currentUserId}
        badgeShowcase={false}
      />
    );
  }

  // Skeleton for direct visits (no cache)
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex gap-4">
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
