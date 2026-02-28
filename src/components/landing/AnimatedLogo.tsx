"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedLogo() {
  const textRef = useRef<SVGTextElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Wait for font to load before measuring
    void document.fonts.ready.then(() => {
      const len = el.getComputedTextLength();
      setPathLength(len);
      // Small delay to ensure CSS applies before animation starts
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  return (
    <svg
      viewBox="0 0 500 100"
      className="w-full max-w-md mx-auto h-auto"
      aria-label="EventTara"
      role="img"
    >
      {/* Stroke animation layer */}
      <text
        ref={textRef}
        x="250"
        y="70"
        textAnchor="middle"
        className="font-cursive"
        style={{
          fontSize: "72px",
          fontWeight: 700,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeDasharray: pathLength || 1000,
          strokeDashoffset: ready ? 0 : pathLength || 1000,
          transition: ready ? "stroke-dashoffset 2s ease-in-out" : "none",
        }}
      >
        EventTara
      </text>
      {/* Fill layer — fades in after stroke completes */}
      <text
        x="250"
        y="70"
        textAnchor="middle"
        className="font-cursive"
        style={{
          fontSize: "72px",
          fontWeight: 700,
          fill: "currentColor",
          stroke: "none",
          opacity: ready ? 1 : 0,
          transition: ready ? "opacity 0.8s ease-in 1.8s" : "none",
        }}
      >
        EventTara
      </text>
    </svg>
  );
}
