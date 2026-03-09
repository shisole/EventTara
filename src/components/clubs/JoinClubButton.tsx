"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { NavLink } from "@/components/navigation/NavigationContext";
import { Button } from "@/components/ui";
import { type ClubRole } from "@/lib/clubs/types";

interface JoinClubButtonProps {
  clubSlug: string;
  visibility: "public" | "private";
  initialMembership: { role: ClubRole; userId: string } | null;
  currentUserId: string | null;
}

export default function JoinClubButton({
  clubSlug,
  visibility,
  initialMembership,
  currentUserId,
}: JoinClubButtonProps) {
  const router = useRouter();
  const [membership, setMembership] = useState(initialMembership);
  const [loading, setLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleJoin = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/members`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setMembership({ role: data.member.role, userId: currentUserId });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/members/${currentUserId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembership(null);
        setShowLeaveConfirm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Already a member
  if (membership) {
    const isStaff =
      membership.role === "owner" || membership.role === "admin" || membership.role === "moderator";

    if (isStaff) {
      return (
        <NavLink href={`/dashboard/clubs/${clubSlug}`}>
          <Button variant="secondary" size="sm">
            Manage Club
          </Button>
        </NavLink>
      );
    }

    if (showLeaveConfirm) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowLeaveConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeave}
            disabled={loading}
            className="!border-red-400 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950"
          >
            {loading ? "Leaving..." : "Confirm Leave"}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          Member
        </span>
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Leave
        </button>
      </div>
    );
  }

  // Not a member
  if (visibility === "private") {
    return (
      <Button variant="outline" size="sm" disabled>
        <svg className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        Invite Only
      </Button>
    );
  }

  return (
    <Button variant="primary" size="sm" onClick={handleJoin} disabled={loading}>
      {loading ? "Joining..." : "Join Club"}
    </Button>
  );
}
