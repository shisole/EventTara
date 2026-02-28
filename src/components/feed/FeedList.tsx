"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import FeedCard from "@/components/feed/FeedCard";
import { SpinnerIcon } from "@/components/icons";
import { SkeletonFeedCard } from "@/components/ui";
import type { FeedItem } from "@/lib/feed/types";

const BATCH_SIZE = 15;

interface FeedListProps {
  initialItems: FeedItem[];
  initialHasMore: boolean;
  isAuthenticated: boolean;
}

export default function FeedList({ initialItems, initialHasMore, isAuthenticated }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(initialItems.length > 0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/feed?offset=${String(items.length)}&limit=${String(BATCH_SIZE)}`,
      );
      const data: { items: FeedItem[]; hasMore: boolean } = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setInitialLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, items.length]);

  // Load on mount if no initial items were provided
  useEffect(() => {
    if (!initialLoaded) {
      void loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!initialLoaded && isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonFeedCard />
        <SkeletonFeedCard />
        <SkeletonFeedCard />
      </div>
    );
  }

  if (items.length === 0 && initialLoaded) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">&#x26A1;</p>
        <p className="text-gray-500 dark:text-gray-400">
          No activity yet. Book an event to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedCard
          key={`${item.activityType}-${item.id}`}
          item={item}
          isAuthenticated={isAuthenticated}
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && <SpinnerIcon className="w-6 h-6 text-lime-500 animate-spin" />}
        </div>
      )}
    </div>
  );
}
