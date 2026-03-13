"use client";

import { useEffect, useRef, useState } from "react";

import { CoinIcon } from "@/components/shop/TokenBalanceBar";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

interface TokenRewardToastProps {
  /** Number of tokens earned */
  amount: number;
  /** Label shown below the amount (e.g. "Signup Bonus") */
  label?: string;
  /** Called when the user dismisses the modal */
  onDone?: () => void;
}

/**
 * Small celebratory modal for token rewards.
 *
 * Fires gold confetti on mount and shows a centered modal with the
 * token amount + a dismiss button. Render conditionally:
 *
 * ```tsx
 * {reward && <TokenRewardToast amount={reward} label="Signup Bonus" onDone={() => setReward(null)} />}
 * ```
 */
export default function TokenRewardToast({ amount, label, onDone }: TokenRewardToastProps) {
  const hasFired = useRef(false);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    void fireConfetti("token");
  }, []);

  const handleDismiss = () => {
    setPhase("exit");
    setTimeout(() => onDone?.(), 250);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        "transition-opacity duration-250",
        phase === "enter" ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-2xl px-8 py-6",
          "bg-white shadow-xl ring-1 ring-amber-100",
          "dark:bg-gray-900 dark:ring-amber-800",
          "transition-transform duration-250",
          phase === "enter" ? "scale-100" : "scale-95",
        )}
      >
        {/* Coin icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
          <CoinIcon className="h-8 w-8" />
        </div>

        {/* Amount */}
        <p className="font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
          +{amount} TaraTokens
        </p>

        {/* Label */}
        {label && <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>}

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            "mt-1 rounded-xl px-8 py-2.5 text-sm font-semibold transition-colors",
            "bg-amber-500 text-white hover:bg-amber-600",
            "dark:bg-amber-600 dark:hover:bg-amber-500",
          )}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
