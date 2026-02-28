"use client";

import { useRef, useState } from "react";

import { SendIcon } from "@/components/icons";
import type { ActivityType, FeedComment } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 300;

interface CommentFormProps {
  activityType: ActivityType;
  activityId: string;
  isAuthenticated: boolean;
  onSubmit: (comment: FeedComment) => void;
}

export default function CommentForm({
  activityType,
  activityId,
  isAuthenticated,
  onSubmit,
}: CommentFormProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !submitting;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      globalThis.location.href = "/login";
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/feed/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, activityId, text: trimmed }),
      });

      if (res.ok) {
        const data: { comment: FeedComment } = await res.json();
        onSubmit(data.comment);
        setText("");
      }
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        maxLength={MAX_LENGTH}
        className="flex-1 min-w-0 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3.5 py-1.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:focus:ring-lime-400"
      />
      {trimmed.length > 0 && (
        <span
          className={cn(
            "text-[10px] shrink-0",
            trimmed.length > MAX_LENGTH ? "text-red-500" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {trimmed.length}/{MAX_LENGTH}
        </span>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="shrink-0 text-lime-600 dark:text-lime-400 disabled:opacity-30 hover:text-lime-700 dark:hover:text-lime-300 transition-colors"
        aria-label="Post comment"
      >
        <SendIcon className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
