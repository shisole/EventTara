"use client";

import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/ui";
import { type ForumReplyWithAuthor } from "@/lib/clubs/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface ForumReplySectionProps {
  clubSlug: string;
  threadId: string;
  isLocked: boolean;
  userId: string;
  isModerator: boolean;
}

export default function ForumReplySection({
  clubSlug,
  threadId,
  isLocked,
  userId,
  isModerator,
}: ForumReplySectionProps) {
  const [replies, setReplies] = useState<ForumReplyWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/replies`);
    if (res.ok) {
      const data: { replies: ForumReplyWithAuthor[] } = await res.json();
      setReplies(data.replies);
    }
    setLoading(false);
  }, [clubSlug, threadId]);

  useEffect(() => {
    void fetchReplies();
  }, [fetchReplies]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: replyText.trim() }),
    });

    if (res.ok) {
      const data: { reply: ForumReplyWithAuthor } = await res.json();
      setReplies((prev) => [...prev, data.reply]);
      setReplyText("");
    }
    setSubmitting(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!globalThis.confirm("Delete this reply?")) return;
    const res = await fetch(`/api/clubs/${clubSlug}/forum/replies/${replyId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-gray-900 dark:text-white">
        Replies ({replies.length})
      </h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-3">
          {replies.map((reply) => {
            const authorName = reply.author?.full_name ?? reply.author?.username ?? "Unknown";
            const canDelete = reply.user_id === userId || isModerator;

            return (
              <div
                key={reply.id}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <Avatar src={reply.author?.avatar_url ?? null} alt={authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {authorName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                    {reply.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No replies yet. Be the first to respond!
        </p>
      )}

      {!isLocked ? (
        <form onSubmit={handleSubmitReply} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a reply... (use @username to mention)"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={2000}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reply
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
          This thread is locked. No new replies.
        </p>
      )}
    </div>
  );
}
