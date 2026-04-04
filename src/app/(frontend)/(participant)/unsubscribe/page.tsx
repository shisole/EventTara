"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "missing">("loading");

  const unsubscribe = useCallback(async (userId: string) => {
    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!uid) {
      setStatus("missing");
      return;
    }
    void unsubscribe(uid);
  }, [uid, unsubscribe]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <div>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <p className="text-gray-500 dark:text-gray-400">Processing your request...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
              <svg
                className="h-8 w-8 text-teal-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white">
              You&apos;ve been unsubscribed
            </h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              You won&apos;t receive any more marketing emails from EventTara. You&apos;ll still get
              transactional emails like booking confirmations.
            </p>
            <Link
              href="/events"
              className="inline-block rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Browse Events
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              We couldn&apos;t process your unsubscribe request. Please try again or contact us.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Contact Us
            </Link>
          </div>
        )}

        {status === "missing" && (
          <div>
            <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white">
              Invalid link
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              This unsubscribe link is invalid. If you need help, please contact us.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
