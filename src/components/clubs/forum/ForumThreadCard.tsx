"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui";
import { type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface ForumThreadCardProps {
  thread: ForumThreadWithAuthor;
  clubSlug: string;
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  poll: {
    label: "Poll",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  },
};

export default function ForumThreadCard({ thread, clubSlug }: ForumThreadCardProps) {
  const typeBadge = TYPE_BADGES[thread.type];
  const authorName = thread.author?.full_name ?? thread.author?.username ?? "Unknown";

  return (
    <Link
      href={`/clubs/${clubSlug}/forum/${thread.id}`}
      className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <Avatar src={thread.author?.avatar_url ?? null} alt={authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && (
            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Pinned</span>
          )}
          {typeBadge && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge.className}`}
            >
              {typeBadge.label}
            </span>
          )}
          {thread.category && (
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {thread.category.name}
            </span>
          )}
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white text-sm mt-0.5 line-clamp-1">
          {thread.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{authorName}</span>
          <span>&middot;</span>
          <span>{formatRelativeTime(thread.last_activity_at)}</span>
          <span>&middot;</span>
          <span>
            {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
          </span>
          {thread.is_locked && (
            <>
              <span>&middot;</span>
              <span className="text-gray-400">Locked</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
