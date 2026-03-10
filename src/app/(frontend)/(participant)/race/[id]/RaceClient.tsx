"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { type RaceData, type RaceParticipant } from "@/lib/races/types";

type RaceState = "idle" | "racing" | "finished";

interface ParticipantProgress {
  participant: RaceParticipant;
  progress: number;
  /** Random speed multiplier so each duck moves at its own pace */
  speed: number;
  /** Small random offset so ducks don't stack perfectly */
  offset: number;
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

function Avatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function RaceClient({ race, isAdmin }: { race: RaceData; isAdmin: boolean }) {
  const initialState: RaceState = race.status === "completed" ? "finished" : "idle";
  const [state, setState] = useState<RaceState>(initialState);
  const [participants, setParticipants] = useState<RaceParticipant[]>(race.participants);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<ParticipantProgress[]>([]);
  const [displayProgress, setDisplayProgress] = useState<ParticipantProgress[]>([]);
  const winnerIdsRef = useRef<Set<string>>(new Set());

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

      winnerIdsRef.current = new Set(data.winners);

      // Shuffle participant order so it's not predictable
      const shuffled = [...data.participants].sort(() => Math.random() - 0.5);

      // Each participant gets a tiny random offset — keeps bars close but not identical
      const entries: ParticipantProgress[] = shuffled.map((p) => ({
        participant: p,
        progress: 0,
        speed: 0.97 + Math.random() * 0.06, // very tight: 0.97 - 1.03
        offset: Math.random() * 5, // used for final non-winner spread
      }));

      progressRef.current = entries;
      setDisplayProgress([...entries]);
      setParticipants(data.participants);
      setState("racing");
      setLoading(false);

      // Animation in 3 phases:
      // Phase 1 (0-6s): Pack racing — everyone stays tight together, reaching ~70%
      // Phase 2 (6-8s): Tension — pack slows, bars jostle, still bunched at ~75-80%
      // Phase 3 (8-9.5s): Sprint finish — winners burst to 100%, losers stall
      const startTime = performance.now();
      const totalDuration = 9500;

      // Throttle renders to every other frame for smoother animation
      let frameCount = 0;

      const animate = (now: number) => {
        frameCount++;
        const elapsed = now - startTime;
        const t = Math.min(elapsed / totalDuration, 1);

        if (elapsed <= 6000) {
          // Phase 1: tight pack racing to ~70%
          const phase1T = elapsed / 6000;
          const eased = 1 - Math.pow(1 - phase1T, 2);
          const base = eased * 70;

          for (const entry of progressRef.current) {
            // Jitter creates natural back-and-forth within ±2%
            const jitter = (Math.random() - 0.5) * 4;
            entry.progress = Math.max(0, Math.min(base + jitter, 72));
          }
        } else if (elapsed <= 8000) {
          // Phase 2: tension — pack bunches up around 75%, slight shuffle
          const phase2T = (elapsed - 6000) / 2000;
          const base = 70 + phase2T * 8; // 70 -> 78

          for (const entry of progressRef.current) {
            const jitter = (Math.random() - 0.5) * 3;
            entry.progress = Math.max(70, Math.min(base + jitter, 80));
          }
        } else {
          // Phase 3: sprint finish!
          const phase3T = (elapsed - 8000) / (totalDuration - 8000);
          const eased3 = 1 - Math.pow(1 - phase3T, 4); // sharp ease-out

          for (const entry of progressRef.current) {
            const isWinner = winnerIdsRef.current.has(entry.participant.user_id);

            if (isWinner) {
              entry.progress = 78 + (100 - 78) * eased3;
            } else {
              // Stall at 80-88%
              const finalPos = 80 + entry.offset * 1.6;
              entry.progress = 78 + (finalPos - 78) * eased3 * 0.6;
            }
          }
        }

        // Only update React state every other frame to reduce re-renders
        if (frameCount % 2 === 0) {
          setDisplayProgress(progressRef.current.map((e) => ({ ...e })));
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          // Final snap
          for (const entry of progressRef.current) {
            entry.progress = winnerIdsRef.current.has(entry.participant.user_id)
              ? 100
              : entry.progress;
          }
          setDisplayProgress(progressRef.current.map((e) => ({ ...e })));
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

  // Racing state — all bars same color, no winner hints
  if (state === "racing") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center dark:text-white">
          {race.title}
        </h1>
        <div className="max-h-[60vh] overflow-y-auto space-y-4">
          {displayProgress.map((entry) => (
            <div key={entry.participant.user_id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Avatar src={entry.participant.avatar_url} name={entry.participant.full_name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium dark:text-white truncate mb-1">
                  {entry.participant.full_name}
                </p>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-none"
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fadeUp">
      <h1 className="text-2xl font-heading font-bold text-center dark:text-white">{race.title}</h1>

      {/* Winners */}
      {winners.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold dark:text-white text-center">
            {"🏆"} Winners
          </h2>
          {winners.map((w) => (
            <div
              key={w.user_id}
              className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4"
            >
              <span className="text-2xl" role="img" aria-label="trophy">
                {"🏆"}
              </span>
              <Avatar src={w.avatar_url} name={w.full_name} size={40} />
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
              <Avatar src={p.avatar_url} name={p.full_name} size={40} />
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
