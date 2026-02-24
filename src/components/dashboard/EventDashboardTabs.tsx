"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import PaymentVerificationPanel from "./PaymentVerificationPanel";

interface EventDashboardTabsProps {
  eventId: string;
  eventPrice: number;
  children: ReactNode; // The existing overview content
}

export default function EventDashboardTabs({
  eventId,
  eventPrice,
  children,
}: EventDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "payments">("overview");

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {(["overview", "payments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize",
              activeTab === tab
                ? "bg-white dark:bg-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        children
      ) : (
        <PaymentVerificationPanel eventId={eventId} eventPrice={eventPrice} />
      )}
    </div>
  );
}
