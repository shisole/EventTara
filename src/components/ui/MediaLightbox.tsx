"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { isVideo } from "@/lib/media";

export interface MediaLightboxItem {
  id: string;
  url: string;
  caption?: string | null;
}

interface MediaLightboxProps {
  items: MediaLightboxItem[];
  selectedIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
}

const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

export default function MediaLightbox({
  items,
  selectedIndex,
  onClose,
  onChange,
}: MediaLightboxProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchRef = useRef({ startX: 0, startTime: 0 });

  const item = items[selectedIndex];
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < items.length - 1;

  const goNext = useCallback(() => {
    if (hasNext) onChange(selectedIndex + 1);
  }, [selectedIndex, hasNext, onChange]);

  const goPrev = useCallback(() => {
    if (hasPrev) onChange(selectedIndex - 1);
  }, [selectedIndex, hasPrev, onChange]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          goNext();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          goPrev();
          break;
        }
        case "Escape": {
          e.preventDefault();
          onClose();
          break;
        }
      }
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    touchRef.current = { startX: e.touches[0].clientX, startTime: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setDragX(e.touches[0].clientX - touchRef.current.startX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const velocity = Math.abs(dragX) / (Date.now() - touchRef.current.startTime);
    const shouldSwipe =
      Math.abs(dragX) > SWIPE_DISTANCE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;

    if (shouldSwipe && dragX < 0) goNext();
    else if (shouldSwipe && dragX > 0) goPrev();
    setDragX(0);
  }, [dragX, goNext, goPrev]);

  const dragTranslate = isDragging ? dragX : 0;
  const contentTransition = isDragging ? "none" : "transform 300ms ease";
  const videoItem = isVideo(item.url);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button — min 44px touch target */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        aria-label="Close lightbox"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
          {selectedIndex + 1} / {items.length}
        </div>
      )}

      {/* Previous button — min 44px touch target */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 sm:left-4"
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}

      {/* Next button — min 44px touch target */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 sm:right-4"
          aria-label="Next"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Content area with touch swipe */}
      <div
        className="relative h-full w-full"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${dragTranslate}px)`, transition: contentTransition }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-12">
          {videoItem ? (
            <video
              key={item.id}
              src={item.url}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] w-auto max-w-full rounded-xl bg-black"
            />
          ) : (
            <Image
              key={item.id}
              src={item.url}
              alt={item.caption || "Photo"}
              width={1200}
              height={800}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
              priority
            />
          )}
          {item.caption && <p className="mt-3 text-center text-white">{item.caption}</p>}
        </div>
      </div>

      {/* Dot indicators for small sets */}
      {items.length > 1 && items.length <= 12 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onChange(i);
              }}
              aria-label={`Go to item ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === selectedIndex ? "w-4 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
