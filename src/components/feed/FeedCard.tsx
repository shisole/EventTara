"use client";

import Image from "next/image";
import Link from "next/link";

import CommentSection from "@/components/feed/CommentSection";
import LikeButton from "@/components/feed/LikeButton";
import RepostButton from "@/components/feed/RepostButton";
import ShareButton from "@/components/feed/ShareButton";
import { RepostIcon } from "@/components/icons";
import { UserAvatar } from "@/components/ui";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { CATEGORY_STYLES, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { feedCache } from "@/lib/feed/cache";
import type { FeedItem } from "@/lib/feed/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface FeedCardProps {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
  badgeShowcase: boolean;
}

export default function FeedCard({
  item,
  isAuthenticated,
  currentUserId,
  badgeShowcase,
}: FeedCardProps) {
  const postHref = `/post/${item.id}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      {/* Repost attribution */}
      {item.repostedBy && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <RepostIcon className="w-3.5 h-3.5" />
          <span>
            Reposted by{" "}
            {item.repostedBy.userUsername ? (
              <Link
                href={`/profile/${item.repostedBy.userUsername}`}
                className="font-medium hover:underline"
              >
                {item.repostedBy.userName}
              </Link>
            ) : (
              <span className="font-medium">{item.repostedBy.userName}</span>
            )}
          </span>
        </div>
      )}

      {/* Clickable content area */}
      <Link
        href={postHref}
        className="block space-y-3"
        onClick={() => feedCache.set(item.id, item, isAuthenticated, currentUserId)}
      >
        {/* Header: avatar + name + badge + organizer + following */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <UserAvatar
              src={item.userAvatarUrl}
              alt={item.userName}
              size="sm"
              borderTier={item.borderTier}
              borderColor={item.borderColor}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {item.userName}
              </span>
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

        {/* Badge showcase (gated by feature flag) */}
        {badgeShowcase && item.activityType === "badge" && item.badgeImageUrl && (
          <BadgeShowcase item={item} />
        )}

        {/* Context image (non-badge activities) */}
        {item.activityType !== "badge" && item.contextImageUrl && (
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
      </Link>

      {/* Action bar: like, repost, share */}
      <div className="flex items-center gap-4">
        <LikeButton
          activityType={item.activityType}
          activityId={item.id}
          likeCount={item.likeCount}
          isLiked={item.isLiked}
          isAuthenticated={isAuthenticated}
        />
        <RepostButton
          activityType={item.activityType}
          activityId={item.id}
          repostCount={item.repostCount}
          isReposted={item.isReposted}
          isAuthenticated={isAuthenticated}
        />
        <ShareButton activityId={item.id} userName={item.userName} text={item.text} />
      </div>

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

function BadgeShowcase({ item }: { item: FeedItem }) {
  const resolved = resolvePresetImage(item.badgeImageUrl);
  const rarity = item.badgeRarity ? RARITY_STYLES[item.badgeRarity] : RARITY_STYLES.common;
  const category = item.badgeCategory ? CATEGORY_STYLES[item.badgeCategory] : null;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Badge image with rarity ring + glow */}
      <div className={`rounded-full ${rarity.ring} ${rarity.glow}`}>
        {resolved?.type === "emoji" ? (
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${resolved.color}`}
          >
            <span className="text-5xl">{resolved.emoji}</span>
          </div>
        ) : resolved?.type === "url" ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={resolved.url}
              alt={item.badgeTitle || "Badge"}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : null}
      </div>

      {/* Badge title */}
      {item.badgeTitle && (
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.badgeTitle}</p>
      )}

      {/* Rarity + category pills */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${rarity.pill}`}>
          {rarity.label}
        </span>
        {category && (
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${category.pill}`}>
            {category.label}
          </span>
        )}
      </div>
    </div>
  );
}
