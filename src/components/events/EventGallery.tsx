"use client";

import Image from "next/image";
import { useState, useRef } from "react";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
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

      {/* Mobile: horizontal scroll / Desktop: grid */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:overflow-visible"
      >
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => { setSelectedIndex(idx); }}
            className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity snap-center shrink-0 w-[70vw] sm:w-auto"
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

      {/* Lightbox with swipe navigation */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedIndex(null); }}
        >
          {/* Prev button */}
          {selectedIndex !== null && selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Previous photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}

          {/* Next button */}
          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              aria-label="Next photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={() => { setSelectedIndex(null); }}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => { e.stopPropagation(); }}
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
