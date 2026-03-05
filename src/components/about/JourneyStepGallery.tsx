"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

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

export default function JourneyStepGallery({
  images,
  aspectRatio = "aspect-[4/3]",
}: JourneyStepGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
    },
    [images.length],
  );

  if (images.length === 1) {
    return (
      <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl shadow-lg`}>
        <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" />
      </div>
    );
  }

  const prevIndex = activeIndex > 0 ? activeIndex - 1 : null;
  const nextIndex = activeIndex < images.length - 1 ? activeIndex + 1 : null;

  return (
    <div className="group relative">
      {/* Card stack */}
      <div className={`relative ${aspectRatio} w-full`}>
        {/* Left card (behind, rotated) */}
        {prevIndex !== null && (
          <button
            onClick={() => goTo(prevIndex)}
            className="absolute inset-y-0 -left-3 z-0 w-[85%] cursor-pointer overflow-hidden rounded-2xl shadow-md transition-all duration-500 ease-out"
            style={{ transform: "rotate(-4deg) scale(0.92)", transformOrigin: "bottom left" }}
            aria-label={`View ${images[prevIndex].alt}`}
          >
            <Image
              src={images[prevIndex].src}
              alt={images[prevIndex].alt}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </button>
        )}

        {/* Right card (behind, rotated) */}
        {nextIndex !== null && (
          <button
            onClick={() => goTo(nextIndex)}
            className="absolute inset-y-0 -right-3 z-0 w-[85%] cursor-pointer overflow-hidden rounded-2xl shadow-md transition-all duration-500 ease-out"
            style={{ transform: "rotate(4deg) scale(0.92)", transformOrigin: "bottom right" }}
            aria-label={`View ${images[nextIndex].alt}`}
          >
            <Image
              src={images[nextIndex].src}
              alt={images[nextIndex].alt}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </button>
        )}

        {/* Center card (on top) */}
        <div className="relative z-10 h-full w-full overflow-hidden rounded-2xl shadow-xl transition-all duration-500 ease-out">
          <Image
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
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
      {prevIndex !== null && (
        <button
          onClick={() => goTo(prevIndex)}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:flex"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      {nextIndex !== null && (
        <button
          onClick={() => goTo(nextIndex)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:flex"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
