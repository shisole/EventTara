import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import { type LeaderboardEntry, getCachedLeaderboardPreview } from "@/lib/leaderboard/preview";
import { cn } from "@/lib/utils";

const MEDAL_STYLES: Record<
  1 | 2 | 3,
  { bg: string; border: string; medal: string; label: string }
> = {
  1: {
    bg: "bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800/80",
    border: "border-amber-300/70 dark:border-amber-700/60",
    medal:
      "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30",
    label: "text-amber-700 dark:text-amber-400",
  },
  2: {
    bg: "bg-gradient-to-b from-slate-100 to-white dark:from-slate-700/40 dark:to-slate-800/80",
    border: "border-slate-300/70 dark:border-slate-600/60",
    medal: "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/20",
    label: "text-slate-600 dark:text-slate-400",
  },
  3: {
    bg: "bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-800/80",
    border: "border-orange-300/70 dark:border-orange-700/60",
    medal:
      "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-400/20",
    label: "text-orange-700 dark:text-orange-400",
  },
};

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const rank: 1 | 2 | 3 = entry.rank <= 1 ? 1 : entry.rank === 2 ? 2 : 3;
  const style = MEDAL_STYLES[rank];
  const isFirst = rank === 1;

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        isFirst ? "pt-0" : rank === 2 ? "pt-6 sm:pt-8" : "pt-8 sm:pt-12",
      )}
    >
      <div
        className={cn(
          "relative flex flex-col items-center rounded-2xl border",
          style.bg,
          style.border,
          isFirst ? "px-5 pb-5 pt-2 sm:px-7 sm:pb-6" : "px-4 pb-4 pt-2 sm:px-5 sm:pb-5",
        )}
      >
        {/* Medal badge */}
        <div
          className={cn(
            "absolute -top-3.5 flex items-center justify-center rounded-full font-bold",
            style.medal,
            isFirst ? "h-8 w-8 text-sm" : "h-7 w-7 text-xs",
          )}
        >
          {rank}
        </div>

        {/* Avatar */}
        <div className={cn(isFirst ? "mb-2.5 mt-3" : "mb-2 mt-2.5")}>
          <UserAvatar src={entry.avatar_url} alt={entry.full_name} size={isFirst ? "xl" : "lg"} />
        </div>

        {/* Name */}
        <p
          className={cn(
            "max-w-[100px] truncate text-center font-heading font-bold leading-tight text-gray-900 sm:max-w-[120px] dark:text-white",
            isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm",
          )}
        >
          {entry.full_name}
        </p>

        {/* Badge count */}
        <p className={cn("mt-1 text-xs font-semibold", style.label)}>
          {entry.metric_value} {entry.metric_value === 1 ? "badge" : "badges"}
        </p>
      </div>
    </div>
  );
}

function RunnerUpCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 dark:border-gray-700 dark:bg-slate-800/60">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        {entry.rank}
      </span>
      <UserAvatar src={entry.avatar_url} alt={entry.full_name} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {entry.full_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {entry.metric_value} {entry.metric_value === 1 ? "badge" : "badges"}
        </p>
      </div>
    </div>
  );
}

export default async function LeaderboardPreviewSection() {
  const entries = await getCachedLeaderboardPreview();

  if (entries.length === 0) return null;

  const podium = entries.slice(0, 3);
  const runnersUp = entries.slice(3, 6);
  const peek = entries.length > 6 ? entries[6] : null;

  // Classic podium order: 2nd - 1st - 3rd
  const podiumOrder = [
    podium.find((e) => e.rank === 2),
    podium.find((e) => e.rank === 1),
    podium.find((e) => e.rank === 3),
  ].filter((e): e is LeaderboardEntry => e != null);

  return (
    <section className="relative bg-white py-12 dark:bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="text-center font-heading text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
          Top Adventurers
        </h2>
        <p className="mx-auto mb-10 mt-4 max-w-2xl text-center text-gray-500 dark:text-gray-400">
          See who&apos;s leading the pack with the most badges earned from outdoor adventures.
        </p>

        {/* Podium */}
        <div className="mb-2 flex items-end justify-center gap-3 sm:gap-5">
          {podiumOrder.map((entry) => (
            <PodiumCard key={entry.rank} entry={entry} />
          ))}
        </div>

        {/* Runners up (4-6) */}
        {runnersUp.length > 0 && (
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {runnersUp.map((entry) => (
              <RunnerUpCard key={entry.rank} entry={entry} />
            ))}
          </div>
        )}

        {/* 7th position - peeking with gradient fade */}
        {peek && (
          <div
            className="relative mx-auto mt-3 flex max-w-2xl justify-center overflow-hidden sm:justify-start"
            style={{ maxHeight: 44 }}
          >
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 dark:border-gray-700 dark:bg-slate-800/60">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {peek.rank}
              </span>
              <UserAvatar src={peek.avatar_url} alt={peek.full_name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {peek.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {peek.metric_value} {peek.metric_value === 1 ? "badge" : "badges"}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-slate-800" />
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/achievements?tab=leaderboards"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-7 py-3 font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-teal-700/30"
          >
            View Full Leaderboard
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
