"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

export default function PublishButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to publish");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handlePublish} disabled={loading}>
        {loading ? "Publishing..." : "Publish"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
