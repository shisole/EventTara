import type { BorderTier } from "@/lib/constants/avatar-borders";

export type ActivityType = "booking" | "checkin" | "badge" | "border";
export type EmojiType = "heart";

export const EMOJI_ICON = "💚";

export interface FeedItem {
  id: string;
  activityType: ActivityType;
  userId: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
  userRole: string | null;
  borderTier: BorderTier | null;
  borderColor: string | null;
  topBadgeTitle: string | null;
  text: string;
  contextImageUrl: string | null;
  timestamp: string;
  isFollowing: boolean;
  likeCount: number;
  isLiked: boolean;
}
