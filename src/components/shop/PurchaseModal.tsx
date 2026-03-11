"use client";

import Image from "next/image";
import { useEffect } from "react";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { type ShopItem } from "./ShopItemCard";
import { CoinIcon } from "./TokenBalanceBar";

interface PurchaseModalProps {
  item: ShopItem | null;
  balance: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string;
}

export default function PurchaseModal({
  item,
  balance,
  isOpen,
  onClose,
  onConfirm,
  loading,
  error,
}: PurchaseModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !item) return null;

  const canAfford = balance >= item.price;
  const balanceAfter = balance - item.price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
      onClick={loading ? undefined : onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl",
          "dark:bg-gray-900",
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Item preview */}
        <div
          className={cn(
            "mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl",
            "bg-gray-50 dark:bg-gray-800",
          )}
        >
          <Image
            src={item.preview_url ?? item.image_url}
            alt={item.name}
            width={96}
            height={96}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Title */}
        <h2
          id="purchase-modal-title"
          className="mb-1 text-center font-heading text-xl font-bold text-gray-900 dark:text-white"
        >
          {item.name}
        </h2>

        {/* Price breakdown */}
        <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
            <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
              <CoinIcon className="h-4 w-4" />
              {item.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Your balance</span>
            <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
              <CoinIcon className="h-4 w-4" />
              {balance.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">After purchase</span>
              <span
                className={cn(
                  "flex items-center gap-1 font-semibold",
                  canAfford ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400",
                )}
              >
                <CoinIcon className="h-4 w-4" />
                {canAfford ? balanceAfter.toLocaleString() : "Insufficient"}
              </span>
            </div>
          </div>
        </div>

        {/* Insufficient balance warning */}
        {!canAfford && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
            You need {(item.price - balance).toLocaleString()} more tokens to buy this item.
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm} disabled={!canAfford || loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
                  />
                </svg>
                Buying...
              </span>
            ) : (
              "Confirm Purchase"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
