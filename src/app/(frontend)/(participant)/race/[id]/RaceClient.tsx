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
  speed: number;
  offset: number;
  /** Per-duck wobble phase so they don't bob in sync */
  wobblePhase: number;
  /** Unique phase for smooth horizontal sway */
  swayPhase: number;
  swaySpeed: number;
  /** Snapshot of progress at start of phase 3 for smooth transition */
  phase3Start: number;
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
        speed: 0.97 + Math.random() * 0.06,
        offset: Math.random() * 5,
        wobblePhase: Math.random() * Math.PI * 2,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.8 + Math.random() * 0.6,
        phase3Start: 0,
        // Non-winners finish between 85-92%, winners at 100%
        finalTarget: 85 + Math.random() * 7,
      }));

      progressRef.current = entries;
      setDisplayProgress([...entries]);
      setParticipants(data.participants);
      setState("racing");
      setLoading(false);

      const startTime = performance.now();
      const totalMs = race.duration_seconds * 1000;
      // Phase boundaries as proportions of total duration
      const phase1End = totalMs * 0.63; // ~63% pack racing
      const phase2End = totalMs * 0.84; // ~84% tension
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

        // Seconds for smoother math
        const sec = elapsed / 1000;

        if (elapsed <= phase1End) {
          // Phase 1: Pack racing — all ducks move together with gentle sine sway
          const phase1T = elapsed / phase1End;
          const eased = 1 - Math.pow(1 - phase1T, 2);
          const base = eased * 70;
          for (const entry of progressRef.current) {
            const sway = Math.sin(sec * entry.swaySpeed + entry.swayPhase) * 2;
            entry.progress = Math.max(0, Math.min(base + sway, 72));
          }
        } else if (elapsed <= phase2End) {
          // Phase 2: Tension — bunched tight, slight oscillation
          const phase2T = (elapsed - phase1End) / (phase2End - phase1End);
          const base = 70 + phase2T * 8;
          for (const entry of progressRef.current) {
            const sway = Math.sin(sec * entry.swaySpeed * 1.5 + entry.swayPhase) * 1.5;
            entry.progress = Math.max(70, Math.min(base + sway, 80));
          }
        } else {
          // Phase 3: Sprint finish — smoothly from current position to target
          const phase3T = (elapsed - phase2End) / (totalMs - phase2End);
          const eased3 = 1 - Math.pow(1 - phase3T, 2.5);
          for (const entry of progressRef.current) {
            // Snapshot each duck's position on first frame of phase 3
            if (entry.phase3Start === 0) {
              entry.phase3Start = entry.progress;
            }
            const isWinner = winnerIdsRef.current.has(entry.participant.user_id);
            const target = isWinner ? 100 : entry.finalTarget;
            entry.progress = entry.phase3Start + (target - entry.phase3Start) * eased3;
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

          {/* Duck lanes */}
          <div className="relative z-10">
            {displayProgress.map((entry, i) => {
              // Wobble: each duck bobs up/down using sin wave with unique phase
              const wobbleY = Math.sin(elapsed / 300 + entry.wobblePhase) * 3;
              // Duck position: 2% to 90% of the track width
              const duckLeft = 2 + (entry.progress / 100) * 88;

              return (
                <div
                  key={entry.participant.user_id}
                  className="relative flex items-center"
                  style={{
                    height: 64,
                    borderBottom:
                      i < displayProgress.length - 1 ? "1px solid rgba(255,255,255,0.12)" : "none",
                  }}
                >
                  {/* Name + avatar on left */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                    <Avatar
                      src={entry.participant.avatar_url}
                      name={entry.participant.full_name}
                      size={24}
                    />
                    <span className="text-xs font-medium text-white drop-shadow-md max-w-[80px] truncate">
                      {entry.participant.full_name.split(" ")[0]}
                    </span>
                  </div>

                  {/* Duck */}
                  <div
                    className="absolute z-10 transition-none select-none"
                    style={{
                      left: `${duckLeft}%`,
                      top: "50%",
                      transform: `translate(-50%, -50%) translateY(${String(wobbleY)}px)`,
                      fontSize: 32,
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
                "repeating-linear-gradient(0deg, transparent, transparent 62px, rgba(255,255,255,0.5) 62px, rgba(255,255,255,0.5) 64px)",
            }}
          />
        </div>

        {/* Legend below river */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {displayProgress.map((entry) => (
            <div key={entry.participant.user_id} className="flex items-center gap-1">
              <Avatar
                src={entry.participant.avatar_url}
                name={entry.participant.full_name}
                size={18}
              />
              <span>{entry.participant.full_name}</span>
            </div>
          ))}
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
