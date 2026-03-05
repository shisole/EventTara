"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface ParallaxMountainProps {
  imageUrl: string;
  children?: ReactNode;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ParallaxMountain({ imageUrl, children }: ParallaxMountainProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const hasChildren = !!children;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    function onScroll() {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrolled = -rect.top;
      const scrollableDistance = sectionHeight - viewportHeight;

      if (scrollableDistance <= 0) return;
      setProgress(clamp(scrolled / scrollableDistance, 0, 1));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  let textOpacity: number;
  let textTranslateY: number;
  let textScale: number;
  let childrenTranslateY = 60;
  let childrenVisible = false;

  if (hasChildren) {
    // Text: fade in 0.15–0.40, then slide up 0.40–0.55
    textOpacity = clamp((progress - 0.15) / 0.25, 0, 1);
    const moveUp = clamp((progress - 0.4) / 0.15, 0, 1);
    textTranslateY = (1 - textOpacity) * 40 - moveUp * 140;
    textScale = 0.9 + textOpacity * 0.1;

    // Children: slide up 0.50–0.80 (opacity handled by children themselves)
    const childrenProgress = clamp((progress - 0.5) / 0.3, 0, 1);
    childrenTranslateY = (1 - childrenProgress) * 60;
    childrenVisible = progress > 0.45;
  } else {
    textOpacity = clamp((progress - 0.3) / 0.5, 0, 1);
    textTranslateY = (1 - textOpacity) * 40;
    textScale = 0.9 + textOpacity * 0.1;
  }

  return (
    <section ref={sectionRef} className={`relative ${hasChildren ? "h-[300vh]" : "h-[200vh]"}`}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <Image
          src={imageUrl}
          alt="Mountain landscape"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Text — starts centered, slides up when children present */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div
            style={{
              opacity: textOpacity,
              transform: `translateY(${textTranslateY}px) scale(${textScale})`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <p className="text-lg sm:text-xl text-white/80 font-medium mb-3">
              Your next adventure awaits
            </p>
            <h2 className="text-3xl sm:text-5xl font-heading font-bold text-white drop-shadow-lg">
              Conquer New Heights
            </h2>
          </div>
        </div>

        {/* Children — positioned below text, no opacity (children manage their own) */}
        {hasChildren && (
          <div
            className="absolute inset-x-0 top-[28%] bottom-0 flex items-center justify-center px-3 sm:top-[20%] sm:px-4"
            style={{
              transform: `translateY(${childrenTranslateY}px)`,
              transition: "transform 0.1s ease-out",
              visibility: childrenVisible ? "visible" : "hidden",
              pointerEvents: childrenVisible ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-5xl">{children}</div>
          </div>
        )}
      </div>
    </section>
  );
}
