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
  /** Called after the toast finishes its exit animation */
  onDone?: () => void;
}

/**
 * Self-contained token reward celebration.
 *
 * When mounted it fires gold confetti and shows a floating "+X TaraTokens"
 * toast that auto-dismisses after ~3 s. Render conditionally:
 *
 * ```tsx
 * {reward && <TokenRewardToast amount={reward} onDone={() => setReward(null)} />}
 * ```
 */
export default function TokenRewardToast({ amount, label, onDone }: TokenRewardToastProps) {
  const hasFired = useRef(false);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    void fireConfetti("token");

    // Start exit after 2.5 s, then call onDone after exit animation (400 ms)
    const exitTimer = setTimeout(() => setPhase("exit"), 2500);
    const doneTimer = setTimeout(() => onDone?.(), 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-24 z-[100] flex justify-center pointer-events-none",
        "transition-all duration-400",
        phase === "enter" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-2.5 rounded-2xl px-5 py-3",
          "bg-white/95 shadow-lg ring-1 ring-amber-200 backdrop-blur-md",
          "dark:bg-gray-900/95 dark:ring-amber-700",
        )}
      >
        <CoinIcon className="h-7 w-7" />
        <div className="flex flex-col">
          <span className="font-heading text-lg font-bold text-amber-600 dark:text-amber-400">
            +{amount} TaraTokens
          </span>
          {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
        </div>
      </div>
    </div>
  );
}
