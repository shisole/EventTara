"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Slide {
  image?: {
    url: string;
    mobileUrl?: string;
    alt: string;
  };
  videoUrl?: string;
  alt: string;
}

interface HeroCarouselProps {
  slides: Slide[];
}

/** Convert full R2 public URLs to local /r2/ proxy path */
function toProxyUrl(url: string): string {
  if (url.startsWith("/r2/")) return url;
  const match = /^https:\/\/pub-[^/]+\.r2\.dev\/(.+)$/.exec(url);
  return match ? `/r2/${match[1]}` : url;
}

const IMAGE_DURATION_MS = 6000;

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const count = slides.length;

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  // Control video playback when active slide changes
  useEffect(() => {
    for (const [index, video] of videoRefs.current) {
      if (index === activeIndex) {
        video.currentTime = 0;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, [activeIndex]);

  // Timer for image slides; video slides advance via onEnded
  useEffect(() => {
    if (count <= 1) return;
    if (slides[activeIndex].videoUrl) return;

    const timer = setTimeout(goToNext, IMAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, count, slides, goToNext]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => {
        const isVideo = !!slide.videoUrl;

        return (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            {isVideo ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(i, el);
                  else videoRefs.current.delete(i);
                }}
                src={toProxyUrl(slide.videoUrl!)}
                autoPlay={i === 0}
                muted
                playsInline
                loop={count === 1}
                className="absolute inset-0 h-full w-full object-cover"
                onEnded={() => {
                  if (count > 1) goToNext();
                }}
              />
            ) : slide.image?.mobileUrl ? (
              <>
                <Image
                  src={slide.image.mobileUrl}
                  alt={slide.image.alt || "Adventure"}
                  fill
                  className="object-cover lg:hidden"
                  sizes="(max-width: 1024px) 100vw, 0px"
                  quality={50}
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <Image
                  src={slide.image.url}
                  alt={slide.image.alt || "Adventure"}
                  fill
                  className="hidden object-cover lg:block"
                  sizes="(min-width: 1025px) 100vw, 0px"
                  quality={50}
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </>
            ) : slide.image ? (
              <Image
                src={slide.image.url}
                alt={slide.image.alt || "Adventure"}
                fill
                className="object-cover"
                sizes="100vw"
                quality={35}
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "auto"}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ) : null}
          </div>
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
