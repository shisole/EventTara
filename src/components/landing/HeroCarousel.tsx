import Image from "next/image";

interface Slide {
  image: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
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
            <Image
              src={slide.image.url}
              alt={slide.image.alt || "Adventure"}
              fill
              className="object-cover"
              sizes="100vw"
              quality={50}
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
