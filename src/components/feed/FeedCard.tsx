"use client";

import Image from "next/image";
import Link from "next/link";

import CommentSection from "@/components/feed/CommentSection";
import LikeButton from "@/components/feed/LikeButton";
import { UserAvatar } from "@/components/ui";
import type { FeedItem } from "@/lib/feed/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface FeedCardProps {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export default function FeedCard({ item, isAuthenticated, currentUserId }: FeedCardProps) {
  const profileHref = item.userUsername
    ? item.userRole === "organizer"
      ? `/organizers/${item.userUsername}`
      : `/profile/${item.userUsername}`
    : "#";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      {/* Header: avatar + name + badge + organizer + following */}
      <div className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0">
          <UserAvatar
            src={item.userAvatarUrl}
            alt={item.userName}
            size="sm"
            borderTier={item.borderTier}
            borderColor={item.borderColor}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={profileHref}
              className="font-semibold text-gray-900 dark:text-white text-sm truncate hover:underline"
            >
              {item.userName}
            </Link>
            {item.topBadgeTitle && (
              <span className="text-[10px] bg-golden-100 dark:bg-golden-900/30 text-golden-700 dark:text-golden-400 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                {item.topBadgeTitle}
              </span>
            )}
            {item.userRole === "organizer" && (
              <span className="text-[10px] bg-teal-500 dark:bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                Organizer
              </span>
            )}
            {item.isFollowing && (
              <span className="text-[10px] bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1.5 py-0.5 rounded-full font-medium">
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

      {/* Like button + comments */}
      <LikeButton
        activityType={item.activityType}
        activityId={item.id}
        likeCount={item.likeCount}
        isLiked={item.isLiked}
        isAuthenticated={isAuthenticated}
      />
      <CommentSection
        activityType={item.activityType}
        activityId={item.id}
        commentCount={item.commentCount}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />
    </div>
  );
}
