"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function FullBleedCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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

  // Phase 1 (0–0.35): just the image, nothing else — the "stop" moment
  // Phase 2 (0.35–0.5): text pops in quickly
  // Phase 3 (0.5–0.6): CTA pops in
  // Phase 4 (0.6–1.0): hold, then scroll away

  const textOpacity = clamp((progress - 0.35) / 0.15, 0, 1);
  const textTranslateY = (1 - textOpacity) * 40;
  const textScale = 0.94 + textOpacity * 0.06;

  const ctaOpacity = clamp((progress - 0.5) / 0.1, 0, 1);
  const ctaTranslateY = (1 - ctaOpacity) * 20;

  // Image has subtle parallax shift
  const imageTranslateY = progress * -10;

  return (
    <section ref={sectionRef} className="relative h-[250vh]">
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${imageTranslateY}%)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <Image
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80"
            alt="Mountain landscape at golden hour"
            fill
            className="object-cover scale-110"
            sizes="100vw"
            quality={60}
            loading="lazy"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Top fade — bleeds from Coco's slate-900 into the image */}
        <div className="absolute inset-x-0 top-0 h-48 sm:h-64 bg-gradient-to-b from-slate-900 via-slate-900/60 to-transparent z-[1]" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-6">
          <div>
            <div
              style={{
                opacity: textOpacity,
                transform: `translateY(${textTranslateY}px) scale(${textScale})`,
                transition: "transform 0.1s ease-out",
              }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Your Next Adventure
                <br />
                Is Waiting
              </h2>
              <p className="text-lg sm:text-xl text-gray-200 max-w-xl mx-auto leading-relaxed">
                From sunrise summit treks to weekend trail runs — find your next story in the great
                outdoors.
              </p>
            </div>

            <div
              style={{
                opacity: ctaOpacity,
                transform: `translateY(${ctaTranslateY}px)`,
                transition: "transform 0.1s ease-out",
              }}
              className="mt-10"
            >
              <Link
                href="/events"
                className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-10 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors shadow-lg shadow-lime-500/25"
              >
                Explore Events
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
      </div>
    </section>
  );
}
