"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface GenerateEventWelcomeButtonProps {
  clubSlug: string;
  clubName: string;
  eventId: string;
  eventTitle: string;
}

export default function GenerateEventWelcomeButton({
  clubSlug,
  clubName,
  eventId,
  eventTitle,
}: GenerateEventWelcomeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const code = `${clubSlug}-${eventId.slice(0, 8)}`;

      const res = await fetch(`/api/clubs/${clubSlug}/welcome-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          title: `Welcome to ${eventTitle}!`,
          subtitle: `Hosted by ${clubName}`,
          event_id: eventId,
        }),
      });

      const json: { error?: string; code?: string } = await res.json();

      if (!res.ok) {
        if (json.code === "DUPLICATE") {
          // Already exists — just reload
          router.refresh();
          return;
        }
        setError(json.error ?? "Failed to create welcome page");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-500 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-lime-500 px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Welcome Page"}
      </button>
    </div>
  );
}
