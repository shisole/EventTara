"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

type Metric = "most_badges" | "most_summits" | "highest_rarity" | "most_active";
type Scope = "global" | "friends";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  metric_value: number;
}

const METRIC_LABELS: Record<Metric, string> = {
  most_badges: "Most Badges",
  most_summits: "Most Summits",
  highest_rarity: "Highest Rarity",
  most_active: "Most Active",
};

const METRIC_UNITS: Record<Metric, string> = {
  most_badges: "badges",
  most_summits: "summits",
  highest_rarity: "points",
  most_active: "events",
};

const METRIC_KEYS: Metric[] = ["most_badges", "most_summits", "highest_rarity", "most_active"];

function isMetric(value: string): value is Metric {
  return (
    value === "most_badges" ||
    value === "most_summits" ||
    value === "highest_rarity" ||
    value === "most_active"
  );
}

export default function LeaderboardsTab() {
  const [scope, setScope] = useState<Scope>("global");
  const [metric, setMetric] = useState<Metric>("most_badges");
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboards?metric=${metric}&scope=${scope}&limit=20`);
        const data: { leaderboards?: LeaderboardEntry[]; yourRank?: number | null } =
          await res.json();
        setLeaderboards(data.leaderboards ?? []);
        setYourRank(data.yourRank ?? null);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
  }, [metric, scope]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Scope</label>
          <div className="flex gap-2">
            {(["global", "friends"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-lg px-4 py-2 font-medium transition-colors",
                  scope === s
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white",
                )}
              >
                {s === "global" ? "Global" : "Friends"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Metric</label>
          <select
            value={metric}
            onChange={(e) => {
              if (isMetric(e.target.value)) setMetric(e.target.value);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
          >
            {METRIC_KEYS.map((m) => (
              <option key={m} value={m}>
                {METRIC_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : leaderboards.length > 0 ? (
          leaderboards.map((entry) => (
            <Link
              key={entry.user_id}
              href={entry.username ? `/profile/${entry.username}` : "#"}
              className="flex items-center justify-between rounded-lg bg-white p-4 transition-shadow hover:shadow-md dark:bg-gray-900"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-right font-heading text-lg font-bold">#{entry.rank}</span>
                <UserAvatar src={entry.avatar_url} alt={entry.full_name} size="sm" />
                <span className="font-semibold">{entry.full_name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-teal-600">{entry.metric_value}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{METRIC_UNITS[metric]}</p>
              </div>
            </Link>
          ))
        ) : (
          <p className="py-8 text-center text-gray-500">No data available</p>
        )}
      </div>

      {/* Your rank */}
      {yourRank && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center dark:border-teal-800 dark:bg-teal-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-300">Your Rank</p>
          <p className="font-heading text-2xl font-bold text-teal-600 dark:text-teal-400">
            #{yourRank}
          </p>
        </div>
      )}
    </div>
  );
}
