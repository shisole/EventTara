"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beta-notice-dismissed";

export default function BetaNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setIsOpen(true);
        setTimeout(() => {
          setIsVisible(true);
        }, 10);
      }
    } catch {
      // Graceful fallback: show modal even if localStorage unavailable
      setIsOpen(true);
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Silently fail — modal won't persist in private browsing
      }
      setIsOpen(false);
    }, 200);
  };

  // Delay before enabling the button
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setReady(true);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible]);

  // Escape key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && ready) {
        handleDismiss();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, ready]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
      onClick={ready ? handleDismiss : undefined}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Icon */}
        <div className="text-center mb-4">
          <span className="text-5xl" role="img" aria-label="celebration">
            🎉
          </span>
        </div>

        {/* Title */}
        <h2
          id="beta-notice-title"
          className="text-2xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4"
        >
          Welcome to EventTara Beta!
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Welcome! You&apos;re exploring a preview of EventTara with sample events and demo
          bookings. Everything you see is for demonstration purposes to show you how the platform
          works.
        </p>

        {/* Button */}
        <button
          onClick={handleDismiss}
          disabled={!ready}
          className={`w-full py-3 px-6 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            ready
              ? "bg-lime-500 hover:bg-lime-400 text-slate-900"
              : "bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed"
          }`}
        >
          {!ready && (
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
          )}
          Got it
        </button>
      </div>
    </div>
  );
}
