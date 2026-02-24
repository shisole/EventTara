"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface EventCarouselProps {
  children: React.ReactNode;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  infinite?: boolean;
  speed?: number;
}

export default function EventCarousel({
  children,
  autoSlide = false,
  autoSlideInterval = 4000,
  infinite = false,
  speed = 30,
}: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isPaused = useRef(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollByOne = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth || 300;
    el.scrollBy({
      left: direction === "left" ? -cardWidth - 24 : cardWidth + 24,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(() => {
      if (isPaused.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByOne("right");
      }
    }, autoSlideInterval);
    return () => { clearInterval(interval); };
  }, [autoSlide, autoSlideInterval, scrollByOne]);

  const scroll = (direction: "left" | "right") => {
    isPaused.current = true;
    scrollByOne(direction);
    setTimeout(() => {
      isPaused.current = false;
    }, autoSlideInterval * 2);
  };

  const infiniteRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const velocity = useRef(1); // 1 = full speed, 0 = stopped
  const targetVelocity = useRef(1);

  // Infinite auto-scroll with requestAnimationFrame + eased velocity
  useEffect(() => {
    if (!infinite) return;
    const el = infiniteRef.current;
    if (!el) return;

    let raf: number;
    const pixelsPerFrame = speed / 60;
    const easeFactor = 0.03; // lower = smoother deceleration

    const step = () => {
      // Ease velocity toward target
      velocity.current += (targetVelocity.current - velocity.current) * easeFactor;
      if (Math.abs(velocity.current) < 0.001) velocity.current = 0;

      if (velocity.current > 0 && !dragging.current) {
        el.scrollLeft += pixelsPerFrame * velocity.current;
        const halfScroll = el.scrollWidth / 2;
        if (el.scrollLeft >= halfScroll) {
          el.scrollLeft -= halfScroll;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); };
  }, [infinite, speed]);

  // Mouse drag handlers for infinite carousel
  const onDragStart = useCallback((e: React.MouseEvent) => {
    const el = infiniteRef.current;
    if (!el) return;
    dragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
  }, []);

  const onDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const el = infiniteRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragScrollLeft.current - (x - dragStartX.current);
  }, []);

  const onDragEnd = useCallback(() => {
    dragging.current = false;
    const el = infiniteRef.current;
    if (el) el.style.cursor = "grab";
  }, []);

  if (infinite) {
    return (
      <div
        ref={infiniteRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide cursor-grab select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        }}
        onMouseEnter={() => {
          targetVelocity.current = 0;
        }}
        onMouseLeave={() => {
          targetVelocity.current = 1;
          onDragEnd();
        }}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onTouchStart={() => {
          targetVelocity.current = 0;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            targetVelocity.current = 1;
          }, 2000);
        }}
      >
        {children}
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mobile: vertical stack */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>

      {/* Desktop: horizontal carousel */}
      <div className="hidden md:block">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollSnapType: "x mandatory" }}
          onMouseEnter={() => {
            isPaused.current = true;
          }}
          onMouseLeave={() => {
            isPaused.current = false;
          }}
          onTouchStart={() => {
            isPaused.current = true;
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              isPaused.current = false;
            }, autoSlideInterval);
          }}
        >
          {children}
        </div>

        {canScrollLeft && (
          <button
            onClick={() => { scroll("left"); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => { scroll("right"); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
