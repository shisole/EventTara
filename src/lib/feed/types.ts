import type { BorderTier } from "@/lib/constants/avatar-borders";
import type { BadgeCategory, BadgeRarity } from "@/lib/constants/badge-rarity";

export type ActivityType = "booking" | "checkin" | "badge" | "border";
export type EmojiType = "heart";

export const EMOJI_ICON = "💚";

export interface FeedItem {
  feedKey: string;
  id: string;
  activityType: ActivityType;
  userId: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
  userRole: string | null;
  organizerProfileId: string | null;
  borderTier: BorderTier | null;
  borderColor: string | null;
  topBadgeTitle: string | null;
  text: string;
  contextImageUrl: string | null;
  badgeId: string | null;
  badgeTitle: string | null;
  badgeImageUrl: string | null;
  badgeRarity: BadgeRarity | null;
  badgeCategory: BadgeCategory | null;
  timestamp: string;
  isFollowing: boolean;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  repostCount: number;
  isReposted: boolean;
  repostedBy?: { userName: string; userUsername: string | null };
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
  borderTier: BorderTier | null;
  borderColor: string | null;
  text: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}
