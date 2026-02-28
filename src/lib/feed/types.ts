export type ActivityType = "booking" | "checkin" | "badge" | "border";
export type EmojiType = "fire" | "clap" | "green_heart" | "mountain";

export const EMOJI_MAP: Record<EmojiType, string> = {
  fire: "🔥",
  clap: "👏",
  green_heart: "💚",
  mountain: "⛰️",
};

export interface FeedItem {
  id: string;
  activityType: ActivityType;
  userId: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
  activeBorderId: string | null;
  topBadgeImageUrl: string | null;
  text: string;
  contextImageUrl: string | null;
  timestamp: string;
  isFollowing: boolean;
  reactions: ReactionSummary[];
  userReactions: EmojiType[];
}

export interface ReactionSummary {
  emoji: EmojiType;
  count: number;
}
