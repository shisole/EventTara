"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beta-notice-dismissed";

export default function EntryBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (
      globalThis.location !== undefined &&
      new URLSearchParams(globalThis.location.search).has("lighthouse")
    )
      return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Proceed to show banner if storage unavailable
    }

    setIsOpen(true);
    setTimeout(() => {
      setIsVisible(true);
    }, 10);
  }, []);

  // Escape key support
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleDismiss() {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Silently fail
    }
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-md transition-transform duration-300 ease-out dark:bg-slate-800/95 md:bg-transparent md:backdrop-blur-none md:dark:bg-transparent ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="safe-area-bottom mx-auto max-w-3xl px-4 pb-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl dark:bg-slate-800 sm:p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-white"
            aria-label="Close banner"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <span className="shrink-0 text-3xl" role="img" aria-label="celebration">
              🎉
            </span>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-heading text-lg font-bold text-white">
                Welcome to EventTara Beta!
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                You&apos;re exploring a preview with sample events and demo bookings. Everything
                here is for demonstration purposes.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-xl bg-lime-500 px-5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
