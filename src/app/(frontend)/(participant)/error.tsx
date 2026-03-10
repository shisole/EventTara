"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";

export default function ParticipantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[participant] Unhandled error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          We encountered an unexpected error. Please try again.
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
