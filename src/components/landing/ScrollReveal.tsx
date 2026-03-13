"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

export default function ScrollReveal({ children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mark as hydrated — content was visible via SSR, now JS can manage animations
    setHydrated(true);

    // If already in viewport on hydration, show immediately without animation
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        // Before hydration: fully visible (SSR-safe, good for Speed Index)
        // After hydration: hidden until IntersectionObserver fires, then animate in
        hydrated ? (isVisible ? "animate-fade-up" : "opacity-0") : "",
        className,
      )}
    >
      {children}
    </div>
  );
}
