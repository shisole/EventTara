"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Skeleton or placeholder shown before the section enters the viewport */
  fallback?: ReactNode;
  /** IntersectionObserver rootMargin — how far before the viewport to start loading */
  rootMargin?: string;
  /** Minimum height for the placeholder to prevent layout shift */
  minHeight?: number;
  /** CSS class applied to the wrapper */
  className?: string;
}

export default function LazySection({
  children,
  fallback,
  rootMargin = "200px",
  minHeight = 100,
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (isVisible) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {fallback}
    </div>
  );
}
