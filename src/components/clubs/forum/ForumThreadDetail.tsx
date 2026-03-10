"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/ui";
import { type ClubRole, type ForumThreadWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

import ForumAdminControls from "./ForumAdminControls";
import ForumPollWidget from "./ForumPollWidget";
import ForumReplySection from "./ForumReplySection";

interface PollVote {
  option_index: number;
  count: number;
}

interface ForumThreadDetailProps {
  clubSlug: string;
  clubName: string;
  threadId: string;
  userId: string;
  userRole: ClubRole;
}

export default function ForumThreadDetail({
  clubSlug,
  clubName,
  threadId,
  userId,
  userRole,
}: ForumThreadDetailProps) {
  const [thread, setThread] = useState<
    (ForumThreadWithAuthor & { poll_votes: PollVote[]; user_vote: number | null }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`);
    if (res.ok) {
      const data: {
        thread: ForumThreadWithAuthor & { poll_votes: PollVote[]; user_vote: number | null };
      } = await res.json();
      setThread(data.thread);
    }
    setLoading(false);
  }, [clubSlug, threadId]);

  useEffect(() => {
    void fetchThread();
  }, [fetchThread]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading thread...</div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Thread not found</p>
        <Link
          href={`/clubs/${clubSlug}`}
          className="text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2 inline-block"
        >
          Back to club
        </Link>
      </div>
    );
  }

  const authorName = thread.author?.full_name ?? thread.author?.username ?? "Unknown";
  const isAuthor = thread.user_id === userId;
  const isMod = userRole === "owner" || userRole === "admin" || userRole === "moderator";

  return (
    <div className="space-y-6">
      <Link
        href={`/clubs/${clubSlug}`}
        className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
      >
        &larr; {clubName} Forum
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {thread.is_pinned && (
            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Pinned</span>
          )}
          {thread.type === "announcement" && (
            <span className="inline-block rounded-full bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              Announcement
            </span>
          )}
          {thread.type === "poll" && (
            <span className="inline-block rounded-full bg-purple-50 dark:bg-purple-950/30 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
              Poll
            </span>
          )}
          {thread.category && (
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {thread.category.name}
            </span>
          )}
          {thread.is_locked && <span className="text-xs text-gray-400">Locked</span>}
        </div>

        <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
          {thread.title}
        </h1>

        <div className="flex items-center gap-3">
          <Avatar src={thread.author?.avatar_url ?? null} alt={authorName} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(thread.created_at)}
            </p>
          </div>
        </div>

        {(isAuthor || isMod) && (
          <ForumAdminControls
            clubSlug={clubSlug}
            threadId={thread.id}
            isPinned={thread.is_pinned}
            isLocked={thread.is_locked}
            isAuthor={isAuthor}
            userRole={userRole}
          />
        )}

        {thread.body && (
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {thread.body}
          </div>
        )}

        {thread.type === "poll" && thread.poll_options && (
          <ForumPollWidget
            clubSlug={clubSlug}
            threadId={thread.id}
            options={thread.poll_options}
            votes={thread.poll_votes}
            userVote={thread.user_vote}
          />
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
        <ForumReplySection
          clubSlug={clubSlug}
          threadId={thread.id}
          isLocked={thread.is_locked}
          userId={userId}
          isModerator={isMod}
        />
      </div>
    </div>
  );
}
