"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui";
import { type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

import { CATEGORY_COLORS } from "./category-colors";

interface ForumThreadCardProps {
  thread: ForumThreadWithAuthor;
  clubSlug: string;
}

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-amber-500 text-white",
  },
  poll: {
    label: "Poll",
    className: "bg-purple-500 text-white",
  },
};

export default function ForumThreadCard({ thread, clubSlug }: ForumThreadCardProps) {
  const authorName = thread.author?.full_name ?? thread.author?.username ?? "Unknown";
  const typeLabel = TYPE_LABELS[thread.type];
  const categoryColor = thread.category
    ? CATEGORY_COLORS[Math.abs(hashCode(thread.category.id)) % CATEGORY_COLORS.length]
    : null;

  return (
    <Link
      href={`/clubs/${clubSlug}/forum/${thread.id}`}
      className={cn(
        "flex items-center gap-4 py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        thread.is_pinned && "bg-teal-50/30 dark:bg-teal-950/10",
      )}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <Avatar src={thread.author?.avatar_url ?? null} alt={authorName} size="sm" />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {thread.is_pinned && (
            <svg
              className="w-3.5 h-3.5 text-teal-500 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {thread.title}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
          <span className="font-medium text-gray-600 dark:text-gray-300">{authorName}</span>
          <span>&middot;</span>
          <span>{formatRelativeTime(thread.last_activity_at)}</span>
          {thread.is_locked && (
            <>
              <span>&middot;</span>
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </>
          )}
        </p>
        {thread.body && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
            {thread.body}
          </p>
        )}
      </div>

      {/* Right side: badges + reply count */}
      <div className="flex items-center gap-3 shrink-0">
        {typeLabel && (
          <span
            className={cn(
              "hidden sm:inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
              typeLabel.className,
            )}
          >
            {typeLabel.label}
          </span>
        )}
        {thread.category && categoryColor && (
          <span
            className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {thread.category.name}
          </span>
        )}
        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-xs font-medium">{thread.reply_count}</span>
        </div>
      </div>
    </Link>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
