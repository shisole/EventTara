"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { MediaLightbox } from "@/components/ui";
import { isVideo } from "@/lib/media";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  image_url: string;
  caption: string | null;
}

function MediaThumbnail({
  item,
  fill,
  className,
}: {
  item: MediaItem;
  fill?: boolean;
  className?: string;
}) {
  if (isVideo(item.image_url)) {
    return (
      <video
        src={item.image_url}
        muted
        playsInline
        preload="metadata"
        className={cn("object-cover", fill && "absolute inset-0 w-full h-full", className)}
      />
    );
  }
  return (
    <Image
      src={item.image_url}
      alt={item.caption || "Event photo"}
      fill={fill}
      className={cn("object-cover", className)}
    />
  );
}

function VideoIndicator() {
  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="text-white text-xs font-medium">Video</span>
    </div>
  );
}

function BentoGrid({
  photos,
  onSelect,
}: {
  photos: MediaItem[];
  onSelect: (index: number) => void;
}) {
  const count = photos.length;

  if (count === 1) {
    return (
      <div className="hidden sm:block">
        <button
          onClick={() => onSelect(0)}
          className="relative w-full aspect-[2/1] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
        >
          <MediaThumbnail item={photos[0]} fill />
          {isVideo(photos[0].image_url) && <VideoIndicator />}
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
            <MediaThumbnail item={photo} fill />
            {isVideo(photo.image_url) && <VideoIndicator />}
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
          <MediaThumbnail item={photos[0]} fill />
          {isVideo(photos[0].image_url) && <VideoIndicator />}
        </button>
        {photos.slice(1).map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => onSelect(idx + 1)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <MediaThumbnail item={photo} fill />
            {isVideo(photo.image_url) && <VideoIndicator />}
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
            <MediaThumbnail item={photo} fill />
            {isVideo(photo.image_url) && <VideoIndicator />}
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
        <MediaThumbnail item={photos[0]} fill />
        {isVideo(photos[0].image_url) && <VideoIndicator />}
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
          <MediaThumbnail item={photo} fill />
          {isVideo(photo.image_url) && <VideoIndicator />}
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

export default function EventGallery({ photos }: { photos: MediaItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

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
            <MediaThumbnail item={photo} fill />
            {isVideo(photo.image_url) && <VideoIndicator />}
          </button>
        ))}
      </div>

      {/* Desktop: bento grid */}
      <BentoGrid photos={photos} onSelect={setSelectedIndex} />

      {/* Lightbox */}
      {selectedIndex !== null && (
        <MediaLightbox
          items={photos.map((p) => ({ id: p.id, url: p.image_url, caption: p.caption }))}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onChange={setSelectedIndex}
        />
      )}
    </div>
  );
}
