"use client";

import { useEffect, useRef, useState } from "react";

export default function ParallaxMountain() {
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

      // How far into the section we've scrolled (0 = top just entered, 1 = fully scrolled through)
      const scrolled = -rect.top;
      const scrollableDistance = sectionHeight - viewportHeight;

      if (scrollableDistance <= 0) return;
      setProgress(Math.min(Math.max(scrolled / scrollableDistance, 0), 1));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Text appears in the second half of the scroll (0.3–0.8 range)
  const textOpacity = Math.min(Math.max((progress - 0.3) / 0.5, 0), 1);
  const textTranslateY = (1 - textOpacity) * 40;
  const textScale = 0.9 + textOpacity * 0.1;

  return (
    <section ref={sectionRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
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
      </div>
    </section>
  );
}
