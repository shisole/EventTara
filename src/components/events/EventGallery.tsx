"use client";

import Image from "next/image";
import { useState, useRef } from "react";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
}

function BentoGrid({ photos, onSelect }: { photos: Photo[]; onSelect: (index: number) => void }) {
  const count = photos.length;

  if (count === 1) {
    return (
      <div className="hidden sm:block">
        <button
          onClick={() => onSelect(0)}
          className="relative w-full aspect-[2/1] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
        >
          <Image
            src={photos[0].image_url}
            alt={photos[0].caption || "Event photo"}
            fill
            className="object-cover"
          />
        </button>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="hidden sm:grid grid-cols-2 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => onSelect(idx)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption || "Event photo"}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="hidden sm:grid grid-cols-2 gap-2" style={{ gridTemplateRows: "1fr 1fr" }}>
        <button
          onClick={() => onSelect(0)}
          className="relative row-span-2 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
        >
          <Image
            src={photos[0].image_url}
            alt={photos[0].caption || "Event photo"}
            fill
            className="object-cover"
          />
        </button>
        {photos.slice(1).map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => onSelect(idx + 1)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption || "Event photo"}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="hidden sm:grid grid-cols-2 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => onSelect(idx)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption || "Event photo"}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  // 5+ photos: 1 large + 4 small grid, last cell shows "+N more" if >5
  const visibleSmall = photos.slice(1, 5);
  const extraCount = count - 5;

  return (
    <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2" style={{ height: 400 }}>
      <button
        onClick={() => onSelect(0)}
        className="relative col-span-2 row-span-2 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
      >
        <Image
          src={photos[0].image_url}
          alt={photos[0].caption || "Event photo"}
          fill
          className="object-cover"
        />
      </button>
      {visibleSmall.map((photo, idx) => (
        <button
          key={photo.id}
          onClick={() => onSelect(idx + 1)}
          className={cn(
            "relative rounded-xl overflow-hidden hover:opacity-90 transition-opacity",
            idx === 3 && extraCount > 0 && "group",
          )}
        >
          <Image
            src={photo.image_url}
            alt={photo.caption || "Event photo"}
            fill
            className="object-cover"
          />
          {idx === 3 && extraCount > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{extraCount}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default function EventGallery({ photos }: { photos: Photo[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4">Event Photos</h2>

      {/* Mobile: horizontal scroll snap */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:hidden"
      >
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(idx)}
            className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity snap-center shrink-0 w-[70vw]"
          >
            <Image
              src={photo.image_url}
              alt={photo.caption || "Event photo"}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Desktop: bento grid */}
      <BentoGrid photos={photos} onSelect={setSelectedIndex} />

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          {selectedIndex !== null && selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}

          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.image_url}
              alt={selectedPhoto.caption || "Event photo"}
              width={1200}
              height={800}
              className="object-contain w-full h-full rounded-xl"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-center mt-3">{selectedPhoto.caption}</p>
            )}
            <p className="text-white/60 text-center text-sm mt-1">
              {(selectedIndex ?? 0) + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
