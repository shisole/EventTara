"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TransferableMember {
  user_id: string;
  full_name: string | null;
  username: string | null;
}

interface OwnershipTransferSectionProps {
  clubSlug: string;
  clubName: string;
  members: TransferableMember[];
}

export default function OwnershipTransferSection({
  clubSlug,
  clubName,
  members,
}: OwnershipTransferSectionProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfirmed = confirmName === clubName && selectedUserId;

  async function handleTransfer() {
    if (!isConfirmed) return;

    // Extra confirmation dialog
    const confirmed = globalThis.confirm(
      `Are you sure you want to transfer ownership of "${clubName}"? This action cannot be undone. You will be demoted to admin.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_owner_user_id: selectedUserId,
          confirm_club_name: confirmName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to transfer ownership");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
      <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/70">
        Transfer ownership of this club to another member. You will be demoted to admin. This action
        cannot be undone.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Owner
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select a member...</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name || member.username || "Unknown"}{" "}
                {member.username ? `(@${member.username})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type <span className="font-semibold">{clubName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder={clubName}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleTransfer}
          disabled={!isConfirmed || loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Transferring..." : "Transfer Ownership"}
        </button>
      </div>
    </div>
  );
}
