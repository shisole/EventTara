"use client";

import { useEffect } from "react";

export default function AuthConfirmedPage() {
  useEffect(() => {
    // Try to close this tab (works if opened by the email client)
    window.close();
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-lime-600 dark:text-lime-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          You&apos;re signed in!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Go back to your booking tab to continue.
          You can close this tab.
        </p>
      </div>
    </div>
  );
}
