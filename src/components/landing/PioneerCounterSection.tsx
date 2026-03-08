"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PioneerStats {
  participants: number;
  clubs: number;
  participantCap: number;
  clubCap: number;
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current || target === 0) return;
    started.current = true;

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { value, start };
}

function CounterCard({
  label,
  count,
  cap,
  emoji,
  onVisible,
}: {
  label: string;
  count: number;
  cap: number;
  emoji: string;
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const observerFired = useRef(false);
  const percentage = cap > 0 ? Math.min((count / cap) * 100, 100) : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || observerFired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observerFired.current) {
          observerFired.current = true;
          onVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <span className="mb-2 text-3xl">{emoji}</span>
      <span className="text-3xl font-bold tabular-nums text-teal-700 dark:text-teal-400 sm:text-4xl">
        {count}
      </span>
      <span className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        of {cap} {label}
      </span>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function PioneerCounterSection() {
  const [stats, setStats] = useState<PioneerStats | null>(null);

  const participantCounter = useCountUp(stats?.participants ?? 0);
  const clubCounter = useCountUp(stats?.clubs ?? 0);

  useEffect(() => {
    fetch("/api/stats/pioneers")
      .then((r) => r.json())
      .then((data: PioneerStats) => setStats(data))
      .catch(console.error);
  }, []);

  if (!stats) return null;

  return (
    <section className="bg-gray-50 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Join the Pioneers
        </h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          Exclusive badges for our earliest community members
        </p>
        <div className="grid grid-cols-2 gap-4">
          <CounterCard
            label="Participants"
            count={participantCounter.value}
            cap={stats.participantCap}
            emoji="🌟"
            onVisible={participantCounter.start}
          />
          <CounterCard
            label="Clubs"
            count={clubCounter.value}
            cap={stats.clubCap}
            emoji="🏔️"
            onVisible={clubCounter.start}
          />
        </div>
      </div>
    </section>
  );
}
