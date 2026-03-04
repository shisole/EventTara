"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SendIcon } from "@/components/icons";
import type { ActivityType, FeedComment } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 300;

interface MentionSuggestion {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface CommentFormProps {
  activityType: ActivityType;
  activityId: string;
  isAuthenticated: boolean;
  onSubmit: (comment: FeedComment) => void;
  onConfirmed: (tempId: string, comment: FeedComment) => void;
  onFailed: (tempId: string) => void;
}

export default function CommentForm({
  activityType,
  activityId,
  isAuthenticated,
  onSubmit,
  onConfirmed,
  onFailed,
}: CommentFormProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // @mention autocomplete state
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const mentionQueryRef = useRef("");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !submitting;

  // Extract current @mention query from cursor position
  const detectMentionQuery = useCallback((value: string, cursorPos: number) => {
    const beforeCursor = value.slice(0, cursorPos);
    const match = /@(\w*)$/.exec(beforeCursor);
    return match ? match[1] : null;
  }, []);

  // Fetch user suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const data: { users: MentionSuggestion[] } = await res.json();
        setSuggestions(data.users);
        setShowSuggestions(data.users.length > 0);
        setSelectedIdx(0);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    const cursorPos = e.target.selectionStart ?? value.length;
    const query = detectMentionQuery(value, cursorPos);

    if (query === null) {
      setShowSuggestions(false);
      mentionQueryRef.current = "";
    } else {
      mentionQueryRef.current = query;
      // Debounce the fetch
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => {
        void fetchSuggestions(query);
      }, 200);
    }
  };

  const insertMention = useCallback(
    (username: string) => {
      const input = inputRef.current;
      if (!input) return;

      const cursorPos = input.selectionStart ?? text.length;
      const beforeCursor = text.slice(0, cursorPos);
      const afterCursor = text.slice(cursorPos);

      // Replace the @query with @username
      const mentionStart = beforeCursor.lastIndexOf("@");
      const newBefore = beforeCursor.slice(0, mentionStart) + `@${username} `;
      const newText = newBefore + afterCursor;

      setText(newText);
      setShowSuggestions(false);
      setSuggestions([]);
      mentionQueryRef.current = "";

      // Focus and set cursor after the inserted mention
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(newBefore.length, newBefore.length);
      });
    },
    [text],
  );

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      globalThis.location.href = "/login";
      return;
    }
    if (!canSubmit) return;

    setShowSuggestions(false);

    const tempId = `temp-${Date.now()}`;

    // Optimistic: show the comment immediately
    const optimistic: FeedComment = {
      id: tempId,
      userId: "",
      userName: "You",
      userUsername: null,
      userAvatarUrl: null,
      borderTier: null,
      borderColor: null,
      text: trimmed,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      pending: true,
    };

    onSubmit(optimistic);
    setText("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/feed/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, activityId, text: trimmed }),
      });

      if (res.ok) {
        const data: { comment: FeedComment } = await res.json();
        onConfirmed(tempId, data.comment);
      } else {
        onFailed(tempId);
      }
    } catch {
      onFailed(tempId);
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedIdx].username);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        e.target instanceof Node &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          maxLength={MAX_LENGTH}
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-3.5 pr-16 py-1.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:focus:ring-lime-400"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          {trimmed.length > 0 && (
            <span
              className={cn(
                "text-[10px]",
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
            className="text-lime-600 dark:text-lime-400 disabled:opacity-30 hover:text-lime-700 dark:hover:text-lime-300 transition-colors"
            aria-label="Post comment"
          >
            <SendIcon className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* @mention autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
        >
          {suggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(user.username);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors",
                idx === selectedIdx
                  ? "bg-gray-100 dark:bg-gray-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-750",
              )}
            >
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
