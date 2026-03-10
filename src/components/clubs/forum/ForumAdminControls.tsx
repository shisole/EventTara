"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { type ClubRole } from "@/lib/clubs/types";

interface ForumAdminControlsProps {
  clubSlug: string;
  threadId: string;
  isPinned: boolean;
  isLocked: boolean;
  isAuthor: boolean;
  userRole: ClubRole;
}

export default function ForumAdminControls({
  clubSlug,
  threadId,
  isPinned,
  isLocked,
  isAuthor,
  userRole,
}: ForumAdminControlsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const isAdmin = userRole === "owner" || userRole === "admin";
  const isMod = isAdmin || userRole === "moderator";
  const canDelete = isAuthor || isMod;

  const handlePatch = async (updates: Record<string, unknown>) => {
    setUpdating(true);
    await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setUpdating(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!globalThis.confirm("Delete this thread? This cannot be undone.")) return;
    setUpdating(true);
    const res = await fetch(`/api/clubs/${clubSlug}/forum/threads/${threadId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(`/clubs/${clubSlug}`);
    }
    setUpdating(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isAdmin && (
        <button
          onClick={() => handlePatch({ is_pinned: !isPinned })}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>
      )}
      {isMod && (
        <button
          onClick={() => handlePatch({ is_locked: !isLocked })}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {isLocked ? "Unlock" : "Lock"}
        </button>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={updating}
          className="text-xs px-3 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
