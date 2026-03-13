"use client";

import { cn } from "@/lib/utils";

interface TokenBalanceBarProps {
  balance: number;
  loading?: boolean;
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#F59E0B" />
      <circle cx="12" cy="12" r="7.5" fill="#FBBF24" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400E">
        T
      </text>
    </svg>
  );
}

export { CoinIcon };

export default function TokenBalanceBar({ balance, loading }: TokenBalanceBarProps) {
  return (
    <div
      className={cn(
        "sticky top-16 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md",
        "dark:border-gray-800 dark:bg-gray-950/90",
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Balance</span>
        <div className="flex items-center gap-1.5">
          <CoinIcon />
          {loading ? (
            <div className="h-5 w-12 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ) : (
            <span className="font-heading text-lg font-bold text-gray-900 dark:text-white">
              {balance.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
