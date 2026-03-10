"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth] Unhandled error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-100">
          Authentication Error
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Something went wrong during authentication. Please try again.
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
