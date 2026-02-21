"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beta-notice-dismissed";

export default function BetaNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 10);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsOpen(false);
    }, 200);
  };

  // Escape key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
      onClick={handleDismiss}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
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
          Welcome! You&apos;re exploring a preview of EventTara with sample
          events and demo bookings. Everything you see is for demonstration
          purposes to show you how the platform works.
        </p>

        {/* Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 px-6 bg-lime-500 hover:bg-lime-400 text-slate-900 font-semibold rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
