"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { type RaceData, type RaceParticipant } from "@/lib/races/types";
import { cn } from "@/lib/utils";

type RaceState = "idle" | "racing" | "finished";

interface ParticipantProgress {
  participant: RaceParticipant;
  progress: number;
  target: number;
}

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"];
  void confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors });
  const end = Date.now() + 2500;
  const frame = () => {
    void confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    void confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export default function RaceClient({ race, isAdmin }: { race: RaceData; isAdmin: boolean }) {
  const initialState: RaceState = race.status === "completed" ? "finished" : "idle";
  const [state, setState] = useState<RaceState>(initialState);
  const [participants, setParticipants] = useState<RaceParticipant[]>(race.participants);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<ParticipantProgress[]>([]);
  const [displayProgress, setDisplayProgress] = useState<ParticipantProgress[]>([]);

  const startRace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/races/${race.id}/start`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to start race");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as {
        success: boolean;
        winners: string[];
        participants: RaceParticipant[];
      };

      const winnerIds = new Set(data.winners);

      // Initialize progress entries
      const entries: ParticipantProgress[] = data.participants.map((p) => ({
        participant: p,
        progress: 0,
        target: winnerIds.has(p.user_id) ? 100 : 60 + Math.random() * 35,
      }));

      progressRef.current = entries;
      setDisplayProgress([...entries]);
      setParticipants(data.participants);
      setState("racing");
      setLoading(false);

      // Animate
      const startTime = performance.now();
      const duration = 9000;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

        for (const entry of progressRef.current) {
          const jitter = 0.97 + Math.random() * 0.06;
          entry.progress = Math.min(eased * entry.target * jitter, entry.target);
        }

        setDisplayProgress([...progressRef.current]);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure final values
          for (const entry of progressRef.current) {
            entry.progress = entry.target;
          }
          setDisplayProgress([...progressRef.current]);
          setState("finished");
          void fireConfetti();
        }
      };

      requestAnimationFrame(animate);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }, [race.id]);

  // Idle state
  if (state === "idle") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {race.club.logo_url && (
            <div className="flex justify-center">
              <Image
                src={race.club.logo_url}
                alt={race.club.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">{race.club.name}</p>
          <h1 className="text-3xl font-heading font-bold dark:text-white">{race.title}</h1>
          <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
            <span>Waiting to start</span>
            <span className="animate-pulse">...</span>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {isAdmin && (
            <Button onClick={startRace} disabled={loading} className="w-full">
              {loading ? "Starting..." : "Start Race"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Racing state
  if (state === "racing") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center dark:text-white">
          {race.title}
        </h1>
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {displayProgress.map((entry) => (
            <div key={entry.participant.user_id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {entry.participant.avatar_url ? (
                  <Image
                    src={entry.participant.avatar_url}
                    alt={entry.participant.full_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    {entry.participant.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium dark:text-white truncate">
                  {entry.participant.full_name}
                </p>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-none",
                      entry.participant.isWinner ? "bg-lime-500" : "bg-gray-300 dark:bg-gray-500",
                    )}
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Finished state
  const winners = participants.filter((p) => p.isWinner);
  const others = participants.filter((p) => !p.isWinner);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-heading font-bold text-center dark:text-white">{race.title}</h1>

      {/* Winners */}
      {winners.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold dark:text-white">Winners</h2>
          {winners.map((w) => (
            <div
              key={w.user_id}
              className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4"
            >
              <span className="text-2xl" role="img" aria-label="trophy">
                {"🏆"}
              </span>
              <div className="flex-shrink-0">
                {w.avatar_url ? (
                  <Image
                    src={w.avatar_url}
                    alt={w.full_name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center text-sm font-bold text-amber-800 dark:text-amber-200">
                    {w.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium dark:text-white">{w.full_name}</p>
                {w.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{w.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other participants */}
      {others.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold dark:text-white">Participants</h2>
          {others.map((p) => (
            <div
              key={p.user_id}
              className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30"
            >
              <div className="flex-shrink-0">
                {p.avatar_url ? (
                  <Image
                    src={p.avatar_url}
                    alt={p.full_name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium dark:text-white">{p.full_name}</p>
                {p.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{p.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {race.badge_id && (
        <p className="text-center text-sm text-lime-600 dark:text-lime-400 font-medium">
          Winners earned a badge!
        </p>
      )}

      <div className="text-center">
        <Link
          href={`/clubs/${race.club.slug}`}
          className="text-sm text-lime-600 dark:text-lime-400 hover:underline"
        >
          Back to {race.club.name}
        </Link>
      </div>
    </div>
  );
}
