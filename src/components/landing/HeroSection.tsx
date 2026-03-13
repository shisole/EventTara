import Link from "next/link";

import AnimatedLogo from "@/components/landing/AnimatedLogo";
import HeroCarousel from "@/components/landing/HeroCarousel";
import HostEventLink from "@/components/landing/HostEventLink";

interface HeroSlide {
  image: { url: string; mobileUrl?: string; alt: string };
}

interface HeroSectionProps {
  heroData: { slides?: { image?: { url?: string; mobileUrl?: string; alt?: string } }[] } | null;
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const heroSlides: HeroSlide[] = heroData?.slides
    ? heroData.slides
        .filter(
          (slide): slide is { image: { url: string; mobileUrl?: string; alt: string } } =>
            !!slide.image && typeof slide.image === "object" && !!slide.image.url,
        )
        .map((slide) => ({
          image: {
            url: slide.image.url,
            mobileUrl: slide.image.mobileUrl,
            alt: slide.image.alt || "Adventure",
          },
        }))
    : [];

  return (
    <section
      className={`relative overflow-hidden min-h-[100dvh] flex items-center ${
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
        <div className={`mb-6 ${heroSlides.length > 0 ? "text-lime-400" : "text-lime-500"}`}>
          <AnimatedLogo />
        </div>
        <div className="inline-block mb-8 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/30">
          <span className="text-lime-600 dark:text-lime-400 text-sm font-semibold tracking-wide uppercase">
            Beta — Now Live
          </span>
        </div>
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight ${heroSlides.length > 0 ? "text-white" : "text-gray-900 dark:text-white"}`}
        >
          Every Great Adventure
          <br />
          Starts with <span className="text-lime-500">Tara</span>
        </h1>
        <p
          className={`text-lg sm:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed ${heroSlides.length > 0 ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
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
