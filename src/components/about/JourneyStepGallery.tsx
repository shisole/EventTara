"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/icons/ChevronRightIcon";

interface JourneyImage {
  src: string;
  alt: string;
}

interface JourneyStepGalleryProps {
  images: JourneyImage[];
  aspectRatio?: string;
}

const PEEK_PX = 24;
const GAP_PX = 8;

export default function JourneyStepGallery({
  images,
  aspectRatio = "aspect-[4/3]",
}: JourneyStepGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getSlideWidth = useCallback((container: HTMLDivElement): number => {
    const firstChild: HTMLElement | null = container.querySelector(":scope > div");
    if (!firstChild) return container.clientWidth;
    return firstChild.offsetWidth + GAP_PX;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = getSlideWidth(el);
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveIndex(index);
  }, [getSlideWidth]);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const slideWidth = getSlideWidth(el);
      el.scrollTo({ left: index * slideWidth, behavior: "smooth" });
    },
    [getSlideWidth],
  );

  if (images.length === 1) {
    return (
      <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl shadow-lg`}>
        <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className={`${aspectRatio} w-full`}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full snap-x snap-mandatory gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingRight: PEEK_PX,
          }}
        >
          {images.map((image, i) => (
            <div
              key={i}
              className="relative h-full flex-none snap-start overflow-hidden rounded-2xl shadow-lg"
              style={{ width: `calc(100% - ${PEEK_PX + GAP_PX}px)` }}
            >
              <Image src={image.src} alt={image.alt} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === activeIndex
                ? "w-4 bg-gray-800 dark:bg-white"
                : "w-2 bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Arrow buttons (desktop hover) */}
      {activeIndex > 0 && (
        <button
          onClick={() => scrollTo(activeIndex - 1)}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:flex"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      {activeIndex < images.length - 1 && (
        <button
          onClick={() => scrollTo(activeIndex + 1)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:flex"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
