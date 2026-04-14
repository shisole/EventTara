"use client";

import Image from "next/image";
import Link from "next/link";

import CommentSection from "@/components/feed/CommentSection";
import LikeButton from "@/components/feed/LikeButton";
import RepostButton from "@/components/feed/RepostButton";
import ShareButton from "@/components/feed/ShareButton";
import { RepostIcon } from "@/components/icons";
import StarRating from "@/components/reviews/StarRating";
import { UserAvatar } from "@/components/ui";
import { TIER_LABELS, TIER_LABEL_COLORS } from "@/lib/constants/avatar-borders";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { CATEGORY_STYLES, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { feedCache } from "@/lib/feed/cache";
import type { FeedItem } from "@/lib/feed/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface FeedCardProps {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export default function FeedCard({ item, isAuthenticated, currentUserId }: FeedCardProps) {
  const postHref = `/post/${item.id}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      {/* Repost attribution */}
      {item.repostedBy && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <RepostIcon className="w-3.5 h-3.5" />
          <span>
            Reposted by{" "}
            {item.repostedBy.userId === currentUserId ? (
              <span className="font-medium">you</span>
            ) : item.repostedBy.userUsername ? (
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

      {/* Header: avatar + name + badge + organizer + following */}
      <div className="flex items-center gap-3">
        <Link href={item.userUsername ? `/profile/${item.userUsername}` : "#"} className="shrink-0">
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
            {item.userUsername ? (
              <Link
                href={`/profile/${item.userUsername}`}
                className="font-semibold text-gray-900 dark:text-white text-sm truncate hover:underline"
              >
                {item.userName}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {item.userName}
              </span>
            )}
            {item.topBadgeTitle && (
              <span className="text-xs bg-golden-100 dark:bg-golden-900/30 text-golden-700 dark:text-golden-400 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                {item.topBadgeTitle}
              </span>
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

      {/* Clickable content area */}
      <Link
        href={postHref}
        className="block space-y-3"
        onClick={() => feedCache.set(item.id, item, isAuthenticated, currentUserId)}
      >
        {/* Review rating + text */}
        {item.activityType === "review" && item.reviewRating && (
          <div className="space-y-2">
            <StarRating value={item.reviewRating} readonly size="sm" />
            {item.reviewText && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {item.reviewText}
              </p>
            )}
          </div>
        )}

        {/* Badge showcase */}
        {item.activityType === "badge" && item.badgeImageUrl && <BadgeShowcase item={item} />}

        {/* Border showcase */}
        {item.activityType === "border" && item.awardedBorderName && <BorderShowcase item={item} />}

        {/* Photo showcase */}
        {item.activityType === "photo" && item.photoUrls && item.photoUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
            {item.photoUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                <Image src={url} alt="" fill className="object-cover" sizes="300px" />
              </div>
            ))}
          </div>
        )}

        {/* New club showcase */}
        {item.activityType === "new_club" && <ClubShowcase item={item} />}

        {/* New event showcase */}
        {item.activityType === "new_event" && <EventShowcase item={item} />}

        {/* New user showcase */}
        {item.activityType === "new_user" && <NewUserShowcase item={item} />}

        {/* Context image (non-badge/border/photo/club/event/user activities) */}
        {item.activityType !== "badge" &&
          item.activityType !== "border" &&
          item.activityType !== "photo" &&
          item.activityType !== "new_club" &&
          item.activityType !== "new_event" &&
          item.activityType !== "new_user" &&
          item.contextImageUrl && (
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
        postAuthor={{
          userId: item.userId,
          userName: item.userName,
          userUsername: item.userUsername,
          userAvatarUrl: item.userAvatarUrl,
        }}
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

function ClubShowcase({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50">
      {item.contextImageUrl ? (
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
          <Image
            src={item.contextImageUrl}
            alt={item.clubName || ""}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
          <span className="text-teal-600 dark:text-teal-400 text-lg font-bold">
            {(item.clubName || "C")[0]}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          {item.clubName}
        </p>
        {item.clubSlug && <p className="text-xs text-teal-600 dark:text-teal-400">View club →</p>}
      </div>
    </div>
  );
}

function EventShowcase({ item }: { item: FeedItem }) {
  return (
    <div className="rounded-xl overflow-hidden border border-forest-100 dark:border-forest-900/50">
      {item.contextImageUrl && (
        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800">
          <Image
            src={item.contextImageUrl}
            alt={item.eventTitle || ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
        </div>
      )}
      <div className="p-3 bg-forest-50 dark:bg-forest-950/30">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          {item.eventTitle}
        </p>
        {item.clubName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">by {item.clubName}</p>
        )}
        {item.eventId && (
          <p className="text-xs text-forest-600 dark:text-forest-400 mt-1">View event →</p>
        )}
      </div>
    </div>
  );
}

function NewUserShowcase({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-forest-50 dark:bg-forest-950/30 border border-forest-100 dark:border-forest-900/50">
      <div className="w-10 h-10 rounded-full bg-forest-100 dark:bg-forest-900/50 flex items-center justify-center shrink-0">
        <span className="text-forest-600 dark:text-forest-400 text-base">👋</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          Welcome to EventTara!
        </p>
        {item.userUsername && (
          <p className="text-xs text-forest-600 dark:text-forest-400">
            @{item.userUsername} is a new adventurer
          </p>
        )}
        {!item.userUsername && (
          <p className="text-xs text-forest-600 dark:text-forest-400">New adventurer</p>
        )}
      </div>
    </div>
  );
}

function BorderShowcase({ item }: { item: FeedItem }) {
  const tier = item.awardedBorderTier || "common";
  const color = item.awardedBorderColor || "#22c55e";
  const tierLabel = TIER_LABELS[tier];
  const tierColor = TIER_LABEL_COLORS[tier];

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Border preview ring */}
      <div
        className="w-24 h-24 rounded-full"
        style={{
          background: `conic-gradient(${color}, ${color}88, ${color})`,
          padding: "3px",
        }}
      >
        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>

      {/* Border name */}
      {item.awardedBorderName && (
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          {item.awardedBorderName}
        </p>
      )}

      {/* Tier pill */}
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tierColor}`}>
        {tierLabel}
      </span>
    </div>
  );
}
