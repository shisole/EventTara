"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/icons/ChevronRightIcon";
import CloseIcon from "@/components/icons/CloseIcon";

interface JourneyImage {
  src: string;
  alt: string;
}

interface JourneyStepGalleryProps {
  images: JourneyImage[];
  aspectRatio?: string;
}

const SIDE_ROTATION = 3;
const SIDE_SCALE = 0.9;
const SWIPE_THRESHOLD = 0.2; // 20% of container width

// ── Lightbox ────────────────────────────────────────────────────
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: JourneyImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [lightboxDragX, setLightboxDragX] = useState(0);
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const lightboxTouchRef = useRef({ startX: 0, startTime: 0 });

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(images.length - 1, i + 1)),
    [images.length],
  );

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
      case "Escape": {
      onClose();
      break;
      }
      case "ArrowLeft": {
      goPrev();
      break;
      }
      case "ArrowRight": { {
      goNext();
      // No default
      }
      break;
      }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleLightboxTouchStart = useCallback((e: React.TouchEvent) => {
    setIsLightboxDragging(true);
    lightboxTouchRef.current = { startX: e.touches[0].clientX, startTime: Date.now() };
  }, []);

  const handleLightboxTouchMove = useCallback((e: React.TouchEvent) => {
    setLightboxDragX(e.touches[0].clientX - lightboxTouchRef.current.startX);
  }, []);

  const handleLightboxTouchEnd = useCallback(() => {
    setIsLightboxDragging(false);
    const velocity = Math.abs(lightboxDragX) / (Date.now() - lightboxTouchRef.current.startTime);
    const shouldSwipe = Math.abs(lightboxDragX) > 60 || velocity > 0.5;

    if (shouldSwipe && lightboxDragX < 0) goNext();
    else if (shouldSwipe && lightboxDragX > 0) goPrev();
    setLightboxDragX(0);
  }, [lightboxDragX, goPrev, goNext]);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const dragTranslate = isLightboxDragging ? lightboxDragX : 0;
  const imgTransition = isLightboxDragging ? "none" : "transform 300ms ease";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Close lightbox"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <div
        className="relative h-full w-full"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleLightboxTouchStart}
        onTouchMove={handleLightboxTouchMove}
        onTouchEnd={handleLightboxTouchEnd}
        style={{ transform: `translateX(${dragTranslate}px)`, transition: imgTransition }}
      >
        <Image
          src={images[index].src}
          alt={images[index].alt}
          fill
          className="object-contain p-4 sm:p-12"
          sizes="100vw"
          priority
        />
      </div>

      {/* Prev / Next */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white transition-colors hover:bg-black/70"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white transition-colors hover:bg-black/70"
          aria-label="Next image"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              aria-label={`Go to image ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gallery ─────────────────────────────────────────────────────
export default function JourneyStepGallery({
  images,
  aspectRatio = "aspect-[4/3]",
}: JourneyStepGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, startTime: 0 });

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
      setDragX(0);
    },
    [images.length],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    touchRef.current = { startX: e.touches[0].clientX, startTime: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchRef.current.startX;
    setDragX(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const width = containerRef.current?.clientWidth ?? 300;
    const velocity = Math.abs(dragX) / (Date.now() - touchRef.current.startTime);
    const shouldSwipe = Math.abs(dragX) > width * SWIPE_THRESHOLD || velocity > 0.5;

    if (shouldSwipe && dragX < 0) goTo(activeIndex + 1);
    else if (shouldSwipe && dragX > 0) goTo(activeIndex - 1);
    else setDragX(0);
  }, [dragX, activeIndex, goTo]);

  if (images.length === 1) {
    return (
      <>
        <button
          onClick={() => setLightboxIndex(0)}
          className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl shadow-lg cursor-zoom-in`}
          aria-label={`View ${images[0].alt}`}
        >
          <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" />
        </button>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  const prevIndex = activeIndex > 0 ? activeIndex - 1 : null;
  const nextIndex = activeIndex < images.length - 1 ? activeIndex + 1 : null;

  // Normalize drag to -1..1 range based on container width
  const width = containerRef.current?.clientWidth ?? 300;
  const dragProgress = Math.max(-1, Math.min(1, dragX / width));

  // Clamp drag at edges (no prev = can't drag right, no next = can't drag left)
  const clampedProgress =
    prevIndex === null && dragProgress > 0
      ? dragProgress * 0.2
      : nextIndex === null && dragProgress < 0
        ? dragProgress * 0.2
        : dragProgress;

  // Center card follows finger
  const centerTranslateX = clampedProgress * 100;

  // Side cards: interpolate from resting position toward center as you drag toward them
  const leftProgress = Math.max(0, clampedProgress); // 0 at rest, 1 when fully dragged right
  const rightProgress = Math.max(0, -clampedProgress); // 0 at rest, 1 when fully dragged left

  const leftRotation = -SIDE_ROTATION * (1 - leftProgress);
  const leftScale = SIDE_SCALE + (1 - SIDE_SCALE) * leftProgress;

  const rightRotation = SIDE_ROTATION * (1 - rightProgress);
  const rightScale = SIDE_SCALE + (1 - SIDE_SCALE) * rightProgress;

  const transition = isDragging ? "none" : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <div className="group relative">
      <div ref={containerRef} className={`relative ${aspectRatio} w-full px-4`}>
        {/* Left card */}
        {prevIndex !== null && (
          <button
            onClick={() => goTo(prevIndex)}
            className="absolute inset-y-0 left-0 z-0 w-[80%] cursor-pointer overflow-hidden rounded-2xl shadow-md"
            style={{
              transform: `rotate(${leftRotation}deg) scale(${leftScale})`,
              transformOrigin: "bottom left",
              transition,
            }}
            aria-label={`View ${images[prevIndex].alt}`}
          >
            <Image
              src={images[prevIndex].src}
              alt={images[prevIndex].alt}
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-black/20"
              style={{
                opacity: 1 - leftProgress,
                transition: isDragging ? "none" : "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </button>
        )}

        {/* Right card */}
        {nextIndex !== null && (
          <button
            onClick={() => goTo(nextIndex)}
            className="absolute inset-y-0 right-0 z-0 w-[80%] cursor-pointer overflow-hidden rounded-2xl shadow-md"
            style={{
              transform: `rotate(${rightRotation}deg) scale(${rightScale})`,
              transformOrigin: "bottom right",
              transition,
            }}
            aria-label={`View ${images[nextIndex].alt}`}
          >
            <Image
              src={images[nextIndex].src}
              alt={images[nextIndex].alt}
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-black/20"
              style={{
                opacity: 1 - rightProgress,
                transition: isDragging ? "none" : "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </button>
        )}

        {/* Center card */}
        <button
          onClick={() => {
            if (Math.abs(dragX) < 5) setLightboxIndex(activeIndex);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 h-full w-full cursor-zoom-in overflow-hidden rounded-2xl shadow-xl"
          style={{
            transform: `translateX(${centerTranslateX}%)`,
            transition,
          }}
          aria-label={`View ${images[activeIndex].alt}`}
        >
          <Image
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            fill
            className="object-cover"
          />
        </button>
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

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
