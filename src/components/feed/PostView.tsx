"use client";

import Link from "next/link";

import FeedCard from "@/components/feed/FeedCard";
import { ChevronLeftIcon } from "@/components/icons";
import type { FeedItem } from "@/lib/feed/types";

interface PostViewProps {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export default function PostView({ item, isAuthenticated, currentUserId }: PostViewProps) {
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to feed
      </Link>

      <FeedCard item={item} isAuthenticated={isAuthenticated} currentUserId={currentUserId} />
    </div>
  );
}
