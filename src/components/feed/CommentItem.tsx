"use client";

import Link from "next/link";
import { useState } from "react";

import { TrashIcon } from "@/components/icons";
import { UserAvatar } from "@/components/ui";
import type { FeedComment } from "@/lib/feed/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface CommentItemProps {
  comment: FeedComment;
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
}

export default function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);

  const isOwn = currentUserId === comment.userId;

  const profileHref = comment.userUsername ? `/profile/${comment.userUsername}` : "#";

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/feed/comments?id=${comment.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(comment.id);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={cn("flex gap-2 group", comment.pending && "opacity-50")}>
      <Link href={profileHref} className="shrink-0 mt-0.5">
        <UserAvatar
          src={comment.userAvatarUrl}
          alt={comment.userName}
          size="sm"
          borderTier={comment.borderTier}
          borderColor={comment.borderColor}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <Link
            href={profileHref}
            className="text-xs font-semibold text-gray-900 dark:text-white hover:underline truncate"
          >
            {comment.userName}
          </Link>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {comment.pending ? "Sending..." : formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.text}</p>
        {comment.failed && (
          <span className="text-[10px] text-red-500 dark:text-red-400">
            Failed to send. Please try again.
          </span>
        )}
      </div>

      {isOwn && !comment.pending && !comment.failed && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-0.5"
          aria-label="Delete comment"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {comment.failed && (
        <button
          type="button"
          onClick={() => onDelete(comment.id)}
          className="shrink-0 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 mt-0.5"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
