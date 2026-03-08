"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

interface AchievementsTabsProps {
  badgesContent: ReactNode;
  bordersContent: ReactNode;
  leaderboardsContent: ReactNode;
}

type Tab = "badges" | "borders" | "leaderboards";

const VALID_TABS = new Set<string>(["badges", "borders", "leaderboards"]);

const TAB_LABELS: Record<Tab, string> = {
  badges: "Badges",
  borders: "Borders",
  leaderboards: "Leaderboards",
};

function isValidTab(value: string | null): value is Tab {
  return value != null && VALID_TABS.has(value);
}

function getInitialTab(searchParams: ReturnType<typeof useSearchParams>): Tab {
  const param = searchParams.get("tab");
  return isValidTab(param) ? param : "badges";
}

export default function AchievementsTabs({
  badgesContent,
  bordersContent,
  leaderboardsContent,
}: AchievementsTabsProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => getInitialTab(searchParams));

  return (
    <div>
      {/* Tab buttons */}
      <div className="mb-8 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(["badges", "borders", "leaderboards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-4 py-2 font-semibold transition-colors",
              activeTab === tab
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "badges" && badgesContent}
      {activeTab === "borders" && bordersContent}
      {activeTab === "leaderboards" && leaderboardsContent}
    </div>
  );
}
