"use client";

import Image from "next/image";
import Link from "next/link";

import LikeButton from "@/components/feed/LikeButton";
import type { FeedItem } from "@/lib/feed/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface FeedCardProps {
  item: FeedItem;
  isAuthenticated: boolean;
}

export default function FeedCard({ item, isAuthenticated }: FeedCardProps) {
  const profileHref = item.userUsername ? `/profile/${item.userUsername}` : "#";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      {/* Header: avatar + name + badge + following */}
      <div className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {item.userAvatarUrl ? (
              <Image
                src={item.userAvatarUrl}
                alt={item.userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                {item.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={profileHref}
              className="font-semibold text-gray-900 dark:text-white text-sm truncate hover:underline"
            >
              {item.userName}
            </Link>
            {item.topBadgeImageUrl && (
              <Image
                src={item.topBadgeImageUrl}
                alt="Badge"
                width={18}
                height={18}
                className="rounded-full"
              />
            )}
            {item.isFollowing && (
              <span className="text-xs bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1.5 py-0.5 rounded-full font-medium">
                Following
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
        </div>

        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {formatRelativeTime(item.timestamp)}
        </span>
      </div>

      {/* Context image */}
      {item.contextImageUrl && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={item.contextImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
        </div>
      )}

      {/* Like button */}
      <LikeButton
        activityType={item.activityType}
        activityId={item.id}
        likeCount={item.likeCount}
        isLiked={item.isLiked}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
