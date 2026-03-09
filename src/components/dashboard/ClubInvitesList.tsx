"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

interface Invite {
  id: string;
  invite_code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

interface ClubInvitesListProps {
  clubSlug: string;
  clubId: string;
  initialInvites: Invite[];
}

function isExpired(invite: Invite): boolean {
  if (!invite.expires_at) return false;
  return new Date(invite.expires_at) < new Date();
}

function isMaxedOut(invite: Invite): boolean {
  if (invite.max_uses === null) return false;
  return invite.uses >= invite.max_uses;
}

export default function ClubInvitesList({ clubSlug, initialInvites }: ClubInvitesListProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");

  async function handleCreate() {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {};
      if (maxUses) payload.max_uses = Number.parseInt(maxUses, 10);
      if (expiresInDays) payload.expires_in_days = Number.parseInt(expiresInDays, 10);

      const res = await fetch(`/api/clubs/${clubSlug}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMaxUses("");
        setExpiresInDays("");
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(inviteId: string) {
    setDeletingId(inviteId);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  function copyLink(invite: Invite) {
    const url = `${globalThis.location.origin}/join/${clubSlug}?code=${invite.invite_code}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Create new invite */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
        <h2 className="text-lg font-heading font-bold mb-4 dark:text-white">
          Create New Invite Link
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Uses (optional)
            </label>
            <input
              type="number"
              min="1"
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 w-32"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expires In (days, optional)
            </label>
            <input
              type="number"
              min="1"
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 w-32"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="Never"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Invite"}
          </Button>
        </div>
      </div>

      {/* Invites list */}
      <div className="space-y-3">
        {initialInvites.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <p className="text-gray-500 dark:text-gray-400">No invite links yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Create one above to invite members to your club
            </p>
          </div>
        )}

        {initialInvites.map((invite) => {
          const expired = isExpired(invite);
          const maxedOut = isMaxedOut(invite);
          const inactive = expired || maxedOut;

          return (
            <div
              key={invite.id}
              className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${inactive ? "opacity-60" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {invite.invite_code}
                  </code>
                  {expired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      Expired
                    </span>
                  )}
                  {!expired && maxedOut && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                      Max Uses Reached
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-3">
                  <span>
                    Uses: {invite.uses}
                    {invite.max_uses === null ? "" : `/${invite.max_uses}`}
                  </span>
                  {invite.expires_at && (
                    <span>Expires: {new Date(invite.expires_at).toLocaleDateString("en-PH")}</span>
                  )}
                  <span>Created: {new Date(invite.created_at).toLocaleDateString("en-PH")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(invite)}>
                  {copiedId === invite.id ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(invite.id)}
                  disabled={deletingId === invite.id}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
