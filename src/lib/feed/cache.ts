import type { FeedItem } from "@/lib/feed/types";

interface CachedEntry {
  item: FeedItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
  timestamp: number;
}

const TTL = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, CachedEntry>();

export const feedCache = {
  set(id: string, item: FeedItem, isAuthenticated: boolean, currentUserId: string | null) {
    store.set(id, { item, isAuthenticated, currentUserId, timestamp: Date.now() });
  },

  get(id: string): CachedEntry | null {
    const entry = store.get(id);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL) {
      store.delete(id);
      return null;
    }
    return entry;
  },
};
