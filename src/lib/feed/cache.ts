import type { FeedItem } from "@/lib/feed/types";

// --- Single post cache (for instant /post/[id] navigation from feed) ---

interface CachedPostEntry {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
  timestamp: number;
}

const POST_TTL = 5 * 60 * 1000; // 5 minutes
const postStore = new Map<string, CachedPostEntry>();

export const feedCache = {
  set(id: string, item: FeedItem, isAuthenticated: boolean, currentUserId: string | null) {
    postStore.set(id, { item, isAuthenticated, currentUserId, timestamp: Date.now() });
  },

  get(id: string): CachedPostEntry | null {
    const entry = postStore.get(id);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > POST_TTL) {
      postStore.delete(id);
      return null;
    }
    return entry;
  },
};

// --- Feed list cache (preserves state across back navigation) ---

interface CachedFeedList {
  items: FeedItem[];
  hasMore: boolean;
  scrollY: number;
  timestamp: number;
}

const FEED_TTL = 5 * 60 * 1000;
let feedListCache: CachedFeedList | null = null;

export const feedListStore = {
  save(items: FeedItem[], hasMore: boolean, scrollY: number) {
    feedListCache = { items, hasMore, scrollY, timestamp: Date.now() };
  },

  restore(): CachedFeedList | null {
    if (!feedListCache) return null;
    if (Date.now() - feedListCache.timestamp > FEED_TTL) {
      feedListCache = null;
      return null;
    }
    return feedListCache;
  },

  clear() {
    feedListCache = null;
  },
};
