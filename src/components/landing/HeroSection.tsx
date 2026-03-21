import Link from "next/link";

import HeroCarousel from "@/components/landing/HeroCarousel";
import HostEventLink from "@/components/landing/HostEventLink";
import RotatingWord from "@/components/landing/RotatingWord";

interface HeroSlide {
  image?: { url: string; mobileUrl?: string; alt: string };
  videoUrl?: string;
  alt: string;
}

interface HeroSectionProps {
  heroData: {
    slides?: {
      image?: { url?: string; mobileUrl?: string; alt?: string };
      videoUrl?: string;
      alt?: string;
    }[];
  } | null;
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const heroSlides: HeroSlide[] = heroData?.slides
    ? heroData.slides
        .filter((slide) => slide.image?.url || slide.videoUrl)
        .map((slide) => ({
          image: slide.image?.url
            ? {
                url: slide.image.url,
                mobileUrl: slide.image.mobileUrl,
                alt: slide.image.alt || "Adventure",
              }
            : undefined,
          videoUrl: slide.videoUrl,
          alt: slide.image?.alt || slide.alt || "Adventure",
        }))
    : [];

  return (
    <section
      className={`relative overflow-hidden min-h-[100dvh] flex items-center pb-20 md:pb-0 -mt-14 md:-mt-20 ${
        heroSlides.length > 0 ? "bg-gray-900" : "bg-gray-50 dark:bg-slate-900"
      }`}
    >
      {heroSlides.length > 0 ? (
        <>
          <HeroCarousel slides={heroSlides} />
          {/* Bottom gradient fade into next section */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-slate-800 to-transparent z-[1]" />
        </>
      ) : (
        <>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgb(132 204 22 / 0.1) 0%, transparent 70%)",
            }}
          />
        </>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight ${heroSlides.length > 0 ? "text-white" : "text-gray-900 dark:text-white"}`}
        >
          Every Great Adventure
          <br />
          Starts with <RotatingWord />
        </h1>
        <p
          className={`text-sm sm:text-xl lg:text-2xl mb-6 sm:mb-10 max-w-3xl mx-auto leading-relaxed ${heroSlides.length > 0 ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
        >
          Discover outdoor events, join adventure clubs, and book your spot — hiking, biking,
          running, and trail running across the Philippines, all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/events"
            className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors shadow-lg shadow-lime-500/25"
          >
            Explore Events
          </Link>
          <HostEventLink />
        </div>
      </div>
    </section>
  );
}
