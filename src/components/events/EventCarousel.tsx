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
  const mobileRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
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
    return () => {
      clearInterval(interval);
    };
  }, [autoSlide, autoSlideInterval, scrollByOne]);

  // Mobile: track active card index for dot indicators
  useEffect(() => {
    const el = mobileRef.current;
    if (!el) return;

    setTotalCards(el.children.length);

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const card = el.querySelector<HTMLElement>(":scope > *");
      const cardWidth = card?.offsetWidth || 280;
      const gap = 16;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveIndex(index);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    isPaused.current = true;
    scrollByOne(direction);
    setTimeout(() => {
      isPaused.current = false;
    }, autoSlideInterval * 2);
  };

  const infiniteRef = useRef<HTMLDivElement>(null);
  const velocity = useRef(1); // 1 = full speed, 0 = stopped
  const targetVelocity = useRef(1);
  const offsetRef = useRef(0);
  const touchStartX = useRef(0);
  const touchOffsetStart = useRef(0);

  // Infinite auto-scroll with requestAnimationFrame + CSS transform (works on mobile)
  useEffect(() => {
    if (!infinite) return;
    const el = infiniteRef.current;
    if (!el) return;

    let raf: number;
    const pixelsPerFrame = speed / 60;
    const easeFactor = 0.03;

    const step = () => {
      velocity.current += (targetVelocity.current - velocity.current) * easeFactor;
      if (Math.abs(velocity.current) < 0.001) velocity.current = 0;

      if (velocity.current > 0) {
        offsetRef.current += pixelsPerFrame * velocity.current;
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        el.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [infinite, speed]);

  const applyOffset = useCallback((newOffset: number) => {
    const el = infiniteRef.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    if (halfWidth > 0) {
      newOffset = ((newOffset % halfWidth) + halfWidth) % halfWidth;
    }
    offsetRef.current = newOffset;
    el.style.transform = `translateX(-${newOffset}px)`;
  }, []);

  if (infinite) {
    return (
      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        }}
        onMouseEnter={() => {
          targetVelocity.current = 0;
        }}
        onMouseLeave={() => {
          targetVelocity.current = 1;
        }}
        onTouchStart={(e) => {
          targetVelocity.current = 0;
          velocity.current = 0;
          touchStartX.current = e.touches[0].clientX;
          touchOffsetStart.current = offsetRef.current;
        }}
        onTouchMove={(e) => {
          const delta = touchStartX.current - e.touches[0].clientX;
          applyOffset(touchOffsetStart.current + delta);
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            targetVelocity.current = 1;
          }, 2000);
        }}
      >
        <div ref={infiniteRef} className="flex gap-6 w-max">
          {children}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mobile: horizontal carousel */}
      <div className="md:hidden">
        <div
          ref={mobileRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pl-4 -mr-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {children}
        </div>
        {/* Scroll indicator dots */}
        {totalCards > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: totalCards }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex ? "w-4 bg-lime-500" : "w-1.5 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>

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
            onClick={() => {
              scroll("left");
            }}
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
            onClick={() => {
              scroll("right");
            }}
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
