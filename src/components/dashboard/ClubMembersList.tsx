"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SearchIcon } from "@/components/icons";
import { Avatar, Button, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

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

type RoleFilter = "all" | "owner" | "admin" | "moderator" | "member";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "member", label: "Member" },
];

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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const isOwner = currentUserRole === "owner";

  const filtered = useMemo(() => {
    let result = [...members];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.user?.full_name?.toLowerCase().includes(q) ||
          m.user?.username?.toLowerCase().includes(q),
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }

    return result;
  }, [members, search, roleFilter]);

  const hasFilters = search.trim() || roleFilter !== "all";

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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors",
            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-lime-500/40 focus:border-lime-500",
            "dark:text-white",
          )}
        />
      </div>

      {/* Role pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              roleFilter === opt.value
                ? "bg-lime-500 text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results count + clear */}
      {hasFilters && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {filtered.length} of {members.length} member{members.length === 1 ? "" : "s"}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
            }}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-3">
        {filtered.map((member) => (
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

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <p className="text-gray-500 dark:text-gray-400">
              {hasFilters ? "No members match your filters." : "No members yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
