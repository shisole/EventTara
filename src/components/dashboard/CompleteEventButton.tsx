"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

export default function CompleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to complete event");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" onClick={handleComplete} disabled={loading}>
        {loading ? "Completing..." : "Complete Event"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
