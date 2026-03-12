"use client";

import { useEffect, useId, useRef, useState } from "react";

const WORD = "EventTara";
const LETTER_DELAY = 150;
const INITIAL_DELAY = 200;

export default function AnimatedLogo() {
  const clipId = useId();
  const textRef = useRef<SVGTextElement>(null);
  const [clip, setClip] = useState({ x: 0, w: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;

    void document.fonts.ready.then(() => {
      try {
        const first = el.getExtentOfChar(0);
        const startX = first.x;

        const charEnds: number[] = [];
        for (let i = 0; i < WORD.length; i++) {
          const ext = el.getExtentOfChar(i);
          charEnds.push(ext.x + ext.width - startX + 2);
        }

        delayTimer = setTimeout(() => {
          let count = 0;
          timer = setInterval(() => {
            setClip({ x: startX, w: charEnds[count] });
            count++;
            if (count >= WORD.length) {
              if (timer) clearInterval(timer);
              doneTimer = setTimeout(() => setDone(true), LETTER_DELAY);
            }
          }, LETTER_DELAY);
        }, INITIAL_DELAY);
      } catch {
        setDone(true);
      }
    });

    return () => {
      if (timer) clearInterval(timer);
      if (delayTimer) clearTimeout(delayTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, []);

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
            <rect
              x={clip.x}
              y="0"
              width={clip.w}
              height="100"
              style={{ transition: `width ${Math.round(LETTER_DELAY * 0.7)}ms ease-out` }}
            />
          </clipPath>
        </defs>
      )}
      <text
        ref={textRef}
        x="250"
        y="70"
        textAnchor="middle"
        className="font-cursive"
        clipPath={done ? undefined : `url(#${clipId})`}
        style={{
          fontSize: "72px",
          fontWeight: 700,
          fill: "currentColor",
        }}
      >
        {WORD}
      </text>
    </svg>
  );
}
