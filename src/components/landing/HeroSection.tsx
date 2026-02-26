import dynamic from "next/dynamic";
import Link from "next/link";

import HeroCarousel from "@/components/landing/HeroCarousel";

const HostEventLink = dynamic(() => import("@/components/landing/HostEventLink"), {
  loading: () => (
    <Link
      href="/signup?role=organizer"
      className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 border-2 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
    >
      Host Your Event
    </Link>
  ),
});

interface HeroSlide {
  image: { url: string; alt: string };
}

interface HeroSectionProps {
  heroData: { slides?: { image?: { url?: string; alt?: string } }[] } | null;
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const heroSlides: HeroSlide[] = heroData?.slides
    ? heroData.slides
        .filter(
          (slide): slide is { image: { url: string; alt: string } } =>
            !!slide.image && typeof slide.image === "object" && !!slide.image.url,
        )
        .map((slide) => ({
          image: {
            url: slide.image.url,
            alt: slide.image.alt || "Adventure",
          },
        }))
    : [];

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center">
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : (
        <>
          <div className="absolute inset-0 bg-gray-50 dark:bg-slate-900" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-3xl" />
        </>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/30">
          <span className="text-lime-600 dark:text-lime-400 text-sm font-semibold tracking-wide uppercase">
            Beta — Now Live
          </span>
        </div>
        <h1
          className={`text-5xl sm:text-7xl font-heading font-bold mb-4 ${heroSlides.length > 0 ? "text-white" : "text-gray-900 dark:text-white"}`}
        >
          Tara na!
        </h1>
        <p
          className={`text-xl sm:text-2xl mb-10 max-w-2xl mx-auto ${heroSlides.length > 0 ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
        >
          Book Your Next Adventure. Discover hiking, biking, running events and more across the
          Philippines.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/events"
            className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
          >
            Explore Events
          </Link>
          <HostEventLink />
        </div>
      </div>
    </section>
  );
}
