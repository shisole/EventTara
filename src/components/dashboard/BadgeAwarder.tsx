"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Participant {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  checkedIn: boolean;
  alreadyAwarded: boolean;
}

interface BadgeAwarderProps {
  badgeId: string;
  participants: Participant[];
}

export default function BadgeAwarder({ badgeId, participants }: BadgeAwarderProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(participants.filter((p) => p.checkedIn && !p.alreadyAwarded).map((p) => p.userId)),
  );
  const [loading, setLoading] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const toggleUser = (userId: string) => {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelected(next);
  };

  const selectAllCheckedIn = () => {
    setSelected(
      new Set(participants.filter((p) => p.checkedIn && !p.alreadyAwarded).map((p) => p.userId)),
    );
  };

  const handleAward = async () => {
    if (selected.size === 0) return;
    setLoading(true);

    const res = await fetch("/api/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId, user_ids: Array.from(selected) }),
    });

    setLoading(false);
    if (res.ok) {
      setAwarded(true);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold dark:text-white">Award Badge</h3>
        <Button variant="ghost" size="sm" onClick={selectAllCheckedIn}>
          Select All Checked-in
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {participants.map((p) => (
          <button
            key={p.userId}
            type="button"
            disabled={p.alreadyAwarded}
            onClick={() => toggleUser(p.userId)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
              p.alreadyAwarded
                ? "bg-golden-50 opacity-60"
                : selected.has(p.userId)
                  ? "bg-lime-50 dark:bg-lime-950 border-2 border-lime-300 dark:border-lime-700"
                  : "bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700",
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar src={p.avatarUrl} alt={p.fullName} size="sm" />
              <div>
                <span className="font-medium dark:text-white">{p.fullName}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                  {p.alreadyAwarded
                    ? "Already awarded"
                    : p.checkedIn
                      ? "Checked in"
                      : "Not checked in"}
                </span>
              </div>
            </div>
            {!p.alreadyAwarded && selected.has(p.userId) && (
              <span className="text-lime-600 dark:text-lime-400 text-lg">&#10003;</span>
            )}
          </button>
        ))}
      </div>

      {awarded && <p className="text-sm text-forest-500">Badges awarded!</p>}

      <Button onClick={handleAward} disabled={loading || selected.size === 0} className="w-full">
        {loading
          ? "Awarding..."
          : `Award Badge to ${selected.size} Participant${selected.size !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
