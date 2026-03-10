"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input } from "@/components/ui";

interface Badge {
  id: string;
  title: string;
  image_url: string | null;
}

interface CreateRaceFormProps {
  clubSlug: string;
  badges: Badge[];
}

export default function CreateRaceForm({ clubSlug, badges }: CreateRaceFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("Duck Race");
  const [numWinners, setNumWinners] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [badgeId, setBadgeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/races`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          num_winners: numWinners,
          duration_seconds: durationSeconds,
          badge_id: badgeId || null,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Failed to create race");
        setLoading(false);
        return;
      }

      const race: { id: string } = await res.json();
      router.push(`/race/${race.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <Input
        id="race-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Input
        id="num-winners"
        label="Number of Winners"
        type="number"
        min={1}
        value={numWinners}
        onChange={(e) => setNumWinners(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
        required
      />

      <Input
        id="duration"
        label="Race Duration (seconds)"
        type="number"
        min={5}
        max={60}
        value={durationSeconds}
        onChange={(e) =>
          setDurationSeconds(Math.max(5, Math.min(60, Number.parseInt(e.target.value, 10) || 10)))
        }
        required
      />

      <div className="space-y-1">
        <label
          htmlFor="badge-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Badge (optional)
        </label>
        <select
          id="badge-select"
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
        >
          <option value="">No badge</option>
          {badges.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Race"}
      </Button>
    </form>
  );
}
