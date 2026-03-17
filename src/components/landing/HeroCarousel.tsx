import Image from "next/image";

interface Slide {
  image: {
    url: string;
    mobileUrl?: string;
    alt: string;
  };
}

interface HeroCarouselProps {
  slides: Slide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  if (slides.length === 0) return null;

  const count = slides.length;
  const durationPerSlide = 6; // seconds per slide
  const totalDuration = count * durationPerSlide;

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => {
        const delay = i * durationPerSlide;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={
              count > 1
                ? {
                    animation: `heroFade ${totalDuration}s ${delay}s infinite`,
                    opacity: i === 0 ? 1 : 0,
                  }
                : undefined
            }
          >
            {slide.image.mobileUrl ? (
              <>
                {/* Mobile-optimized image (hidden on desktop) */}
                <Image
                  src={slide.image.mobileUrl}
                  alt={slide.image.alt || "Adventure"}
                  fill
                  className="object-cover lg:hidden"
                  sizes="(max-width: 1024px) 100vw, 0px"
                  quality={35}
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {/* Desktop image (hidden on mobile) */}
                <Image
                  src={slide.image.url}
                  alt={slide.image.alt || "Adventure"}
                  fill
                  className="hidden object-cover lg:block"
                  sizes="(min-width: 1025px) 100vw, 0px"
                  quality={35}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </>
            ) : (
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
            )}
          </div>
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
