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
  /** Per-duck wobble phase so they don't bob in sync */
  wobblePhase: number;
  /** Multiple sine layers for unpredictable movement */
  waves: { freq: number; amp: number; phase: number }[];
  /** Snapshot of progress at start of sprint for smooth transition */
  sprintStart: number;
  /** Final target position */
  finalTarget: number;
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
  const elapsedRef = useRef(0);
  const [countdown, setCountdown] = useState(race.duration_seconds);

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

      // Shuffle so order isn't predictable
      const shuffled = [...data.participants].sort(() => Math.random() - 0.5);

      const entries: ParticipantProgress[] = shuffled.map((p) => ({
        participant: p,
        progress: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        // 3-4 layered sine waves per duck → each duck has a unique rhythm
        waves: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => ({
          freq: 0.3 + Math.random() * 1.2,
          amp: 1 + Math.random() * 3,
          phase: Math.random() * Math.PI * 2,
        })),
        sprintStart: 0,
        finalTarget: 85 + Math.random() * 8,
      }));

      progressRef.current = entries;
      setDisplayProgress([...entries]);
      setParticipants(data.participants);
      setState("racing");
      setLoading(false);

      const startTime = performance.now();
      const totalMs = race.duration_seconds * 1000;
      const sprintStart = totalMs * 0.8; // last 20% is the sprint
      let lastCountdown = race.duration_seconds;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        elapsedRef.current = elapsed;
        const t = Math.min(elapsed / totalMs, 1);

        // Update countdown timer
        const remaining = Math.ceil(Math.max(0, (totalMs - elapsed) / 1000));
        if (remaining !== lastCountdown) {
          lastCountdown = remaining;
          setCountdown(remaining);
        }

        const sec = elapsed / 1000;

        if (elapsed <= sprintStart) {
          // Main race: each duck follows a unique path via layered sine waves
          // Base progress moves everyone forward, individual waves create lead changes
          const raceT = elapsed / sprintStart;
          const base = (1 - Math.pow(1 - raceT, 1.8)) * 78;

          for (const entry of progressRef.current) {
            // Sum of sine waves → unique per-duck oscillation pattern
            let offset = 0;
            for (const w of entry.waves) {
              offset += Math.sin(sec * w.freq + w.phase) * w.amp;
            }
            // Scale oscillation up as race progresses (boring start → exciting middle)
            const drama = Math.min(1, raceT * 2);
            entry.progress = Math.max(0, Math.min(base + offset * drama, 82));
          }
        } else {
          // Sprint: smoothly converge each duck from current position to final target
          const sprintT = (elapsed - sprintStart) / (totalMs - sprintStart);
          const eased = 1 - Math.pow(1 - sprintT, 2.5);

          for (const entry of progressRef.current) {
            if (entry.sprintStart === 0) {
              entry.sprintStart = entry.progress;
            }
            const isWinner = winnerIdsRef.current.has(entry.participant.user_id);
            const target = isWinner ? 100 : entry.finalTarget;
            entry.progress = entry.sprintStart + (target - entry.sprintStart) * eased;
          }
        }

        setDisplayProgress(progressRef.current.map((e) => ({ ...e })));

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          for (const entry of progressRef.current) {
            entry.progress = winnerIdsRef.current.has(entry.participant.user_id)
              ? 100
              : entry.progress;
          }
          setDisplayProgress(progressRef.current.map((e) => ({ ...e })));
          setCountdown(0);
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

  // ── Idle state ──
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
          {race.event_title && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{race.event_title}</p>
          )}
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

  // ── Racing state — 2D river view ──
  if (state === "racing") {
    const elapsed = elapsedRef.current;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold dark:text-white">{race.title}</h1>
          <div className="flex items-center gap-2 bg-gray-900/80 dark:bg-gray-800 rounded-full px-4 py-2">
            <span className="text-xl font-mono font-bold text-white tabular-nums">
              {String(Math.floor(countdown / 60)).padStart(2, "0")}:
              {String(countdown % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* River container */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #0e7490 0%, #0891b2 30%, #06b6d4 60%, #22d3ee 100%)",
          }}
        >
          {/* Animated wave overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 42px)",
              animation: "river-flow 2s linear infinite",
            }}
          />

          {/* Finish line */}
          <div
            className="absolute top-0 bottom-0 w-px border-r-2 border-dashed border-white/40"
            style={{ right: "4%" }}
          />
          <div className="absolute text-2xl" style={{ right: "1%", top: "4px" }}>
            {"🏁"}
          </div>

          {/* Ducks — tightly clustered flock */}
          <div
            className="relative z-10"
            style={{ height: Math.max(300, displayProgress.length * 30 + 40) }}
          >
            {displayProgress.map((entry, i) => {
              const wobbleY = Math.sin(elapsed / 300 + entry.wobblePhase) * 3;
              // Each duck occupies a vertical slot, tightly packed (26px apart)
              const topPos = 20 + i * 26;
              // Horizontal position: 5% to 90% of the track
              const duckLeft = 5 + (entry.progress / 100) * 85;

              return (
                <div key={entry.participant.user_id} className="absolute transition-none">
                  {/* Name label — speech bubble above/beside duck */}
                  <div
                    className="absolute z-20 select-none pointer-events-none"
                    style={{
                      left: `${duckLeft}%`,
                      top: topPos - 14,
                      transform: `translateX(-50%) translateY(${String(wobbleY)}px)`,
                    }}
                  >
                    <span className="inline-block rounded bg-white/90 px-1 py-px text-[9px] font-bold text-gray-800 shadow-sm whitespace-nowrap">
                      {entry.participant.full_name.split(" ")[0]}
                    </span>
                  </div>

                  {/* Duck emoji */}
                  <div
                    className="absolute z-10 select-none"
                    style={{
                      left: `${duckLeft}%`,
                      top: topPos,
                      transform: `translate(-50%, -50%) translateY(${String(wobbleY)}px)`,
                      fontSize: 28,
                      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
                    }}
                  >
                    {"🦆"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Water ripple lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.4) 40px, rgba(255,255,255,0.4) 42px)",
            }}
          />
        </div>
      </div>
    );
  }

  // ── Finished state ──
  const winners = participants.filter((p) => p.isWinner);
  const others = participants.filter((p) => !p.isWinner);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fadeUp">
      <h1 className="text-2xl font-heading font-bold text-center dark:text-white">{race.title}</h1>

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
