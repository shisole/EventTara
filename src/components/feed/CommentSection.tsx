"use client";

import { useCallback, useState } from "react";

import CommentForm from "@/components/feed/CommentForm";
import CommentItem from "@/components/feed/CommentItem";
import { ChatIcon } from "@/components/icons";
import type { ActivityType, FeedComment } from "@/lib/feed/types";

interface CommentSectionProps {
  activityType: ActivityType;
  activityId: string;
  commentCount: number;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export default function CommentSection({
  activityType,
  activityId,
  commentCount: initialCount,
  isAuthenticated,
  currentUserId,
}: CommentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(initialCount);

  const fetchComments = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/feed/comments?activity_type=${activityType}&activity_id=${activityId}`,
      );
      if (res.ok) {
        const data: { comments: FeedComment[] } = await res.json();
        setComments(data.comments);
        setCount(data.comments.length);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [activityType, activityId, loaded, loading]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
      void fetchComments();
    }
  };

  const handleNewComment = (comment: FeedComment) => {
    setComments((prev) => [...prev, comment]);
    setCount((prev) => prev + 1);
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-2">
      {/* View comments toggle — only shown when there are comments */}
      {count > 0 && (
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ChatIcon className="w-4 h-4" />
          <span>
            {expanded ? "Hide comments" : `View ${String(count)} comment${count === 1 ? "" : "s"}`}
          </span>
        </button>
      )}

      {/* Expanded comments list */}
      {expanded && (
        <div className="space-y-2 pl-1">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: Math.min(count || 1, 3) }).map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3.5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comments list */}
          {loaded && !loading && comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment input — always visible */}
      <CommentForm
        activityType={activityType}
        activityId={activityId}
        isAuthenticated={isAuthenticated}
        onSubmit={handleNewComment}
      />
    </div>
  );
}
