"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, Button, UIBadge } from "@/components/ui";

interface MemberUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Member {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: MemberUser | null;
}

interface ClubMembersListProps {
  members: Member[];
  clubSlug: string;
  currentUserRole: string;
}

const roleBadgeVariant: Record<string, string> = {
  owner: "trail_run",
  admin: "hiking",
  moderator: "mtb",
  member: "default",
};

export default function ClubMembersList({
  members,
  clubSlug,
  currentUserRole,
}: ClubMembersListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const isOwner = currentUserRole === "owner";

  async function handleRoleChange(memberId: string, userId: string, newRole: string) {
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRemove(memberId: string, userId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setLoadingId(memberId);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 flex items-center gap-4"
        >
          <Avatar
            src={member.user?.avatar_url ?? null}
            alt={member.user?.full_name ?? "Unknown User"}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium dark:text-white truncate">
              {member.user?.full_name ?? "Unknown User"}
            </p>
            {member.user?.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400">@{member.user.username}</p>
            )}
          </div>
          <UIBadge variant={roleBadgeVariant[member.role] ?? "default"}>{member.role}</UIBadge>

          {isOwner && member.role !== "owner" && (
            <div className="flex items-center gap-2">
              <select
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:text-white"
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, member.user_id, e.target.value)}
                disabled={loadingId === member.id}
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(member.id, member.user_id)}
                disabled={loadingId === member.id}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      ))}

      {members.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <p className="text-gray-500 dark:text-gray-400">No members yet</p>
        </div>
      )}
    </div>
  );
}
