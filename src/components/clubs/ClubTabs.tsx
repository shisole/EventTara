"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface ClubTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: Record<string, ReactNode>;
}

export default function ClubTabs({ tabs, defaultTab, children }: ClubTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-teal-600 dark:text-teal-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                ({tab.count})
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
      {children[activeTab]}
    </div>
  );
}
