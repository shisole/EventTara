"use client";

import { useEffect, useId, useRef, useState } from "react";

const WORD = "EventTara";
const DURATION = 1800;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function AnimatedLogo() {
  const clipId = useId();
  const glowId = useId();
  const textRef = useRef<SVGTextElement>(null);
  const boundsRef = useRef({ startX: 0, totalW: 0 });
  const [progress, setProgress] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    let rafId = 0;

    void document.fonts.ready.then(() => {
      try {
        const first = el.getExtentOfChar(0);
        const last = el.getExtentOfChar(WORD.length - 1);
        boundsRef.current = {
          startX: first.x,
          totalW: last.x + last.width - first.x + 4,
        };

        const t0 = performance.now() + 300;
        const tick = (now: number) => {
          if (now < t0) {
            rafId = requestAnimationFrame(tick);
            return;
          }
          const p = Math.min((now - t0) / DURATION, 1);
          setProgress(easeInOutCubic(p));
          if (p < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            setTimeout(() => setDone(true), 150);
          }
        };
        rafId = requestAnimationFrame(tick);
      } catch {
        setDone(true);
        setProgress(1);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  const { startX, totalW } = boundsRef.current;
  const w = Math.max(0, progress) * totalW;
  const showCursor = progress > 0 && progress < 1;

  return (
    <svg
      viewBox="0 0 500 100"
      className="w-full max-w-lg mx-auto h-auto"
      aria-label="EventTara"
      role="img"
    >
      {!done && (
        <defs>
          <clipPath id={clipId}>
            <rect x={startX} y="0" width={w} height="100" />
          </clipPath>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      <text
        ref={textRef}
        x="250"
        y="70"
        textAnchor="middle"
        className="font-cursive"
        clipPath={done ? undefined : `url(#${clipId})`}
        style={{ fontSize: "72px", fontWeight: 700, fill: "currentColor" }}
      >
        {WORD}
      </text>
      {showCursor && <circle cx={startX + w} cy="50" r="14" fill={`url(#${glowId})`} />}
    </svg>
  );
}
