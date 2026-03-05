import { Suspense } from "react";

import BentoEventsSection from "@/components/landing/BentoEventsSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import ContactCTASection from "@/components/landing/ContactCTASection";
import EntryBanner from "@/components/landing/EntryBanner";
import FAQSection from "@/components/landing/FAQSection";
import FeedShowcaseSection from "@/components/landing/FeedShowcaseSection";
import GamificationSection from "@/components/landing/GamificationSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import OrganizersSection from "@/components/landing/OrganizersSection";
import OrganizerWaitlistModal from "@/components/landing/OrganizerWaitlistModal";
import ParallaxMountain from "@/components/landing/ParallaxMountain";
import StravaShowcaseSection from "@/components/landing/StravaShowcaseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import {
  getCachedHeroCarousel,
  getCachedHomepageSections,
  getCachedSiteSettings,
  parseHeroSlides,
  parseHomepageSections,
} from "@/lib/cms/cached";
import { type CmsHomepageSection } from "@/lib/cms/types";

export const metadata = {
  title: "EventTara — Outdoor Adventure Events in Panay Island",
  description:
    "Discover hiking, trail running, mountain biking, and road cycling events across Panay Island. From the mountains of Igbaras and Tubungan to the coasts of Antique — find your next adventure on EventTara.",
  openGraph: {
    title: "EventTara — Outdoor Adventure Events in Panay Island",
    description:
      "Discover hiking, trail running, mountain biking, and road cycling events across Panay Island. Find your next adventure on EventTara.",
    type: "website" as const,
  },
};

export const revalidate = 300;

const DEFAULT_SECTIONS: CmsHomepageSection[] = [
  { key: "hero", label: "Hero Carousel", enabled: true, order: 0 },
  { key: "upcoming_events", label: "Upcoming Events", enabled: true, order: 1 },
  { key: "strava_showcase", label: "Strava Showcase", enabled: true, order: 2 },
  { key: "how_it_works", label: "How It Works", enabled: true, order: 3 },
  { key: "feed_showcase", label: "Activity Feed Showcase", enabled: true, order: 4 },
  { key: "gamification", label: "Badges & Gamification", enabled: true, order: 5 },
  { key: "categories", label: "Event Categories", enabled: true, order: 6 },
  { key: "organizers", label: "Trusted Organizers", enabled: true, order: 7 },
  { key: "testimonials", label: "Testimonials", enabled: true, order: 8 },
  { key: "faq", label: "FAQ", enabled: true, order: 9 },
  { key: "contact_cta", label: "Contact CTA", enabled: true, order: 10 },
];

function BentoEventsSkeleton() {
  return (
    <section className="bg-white py-12 dark:bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700"
            />
          ))}
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-3 md:grid-rows-2" style={{ height: 480 }}>
          <div className="col-span-1 row-span-2 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700" />
          ))}
        </div>
        <div className="flex gap-4 overflow-hidden md:hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[280px] min-w-[280px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OrganizersSkeleton() {
  return (
    <section className="py-10 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mx-auto mb-8" />
        <div className="flex flex-wrap justify-center gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-14 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-64 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto mb-4" />
        <div className="h-5 w-80 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mx-auto mb-12" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[300px] h-[180px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GamificationSkeleton() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-80 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto mb-4" />
        <div className="h-5 w-96 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mx-auto mb-12" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StravaShowcaseSkeleton() {
  return (
    <div className="bg-gradient-to-b from-orange-50/60 to-white py-16 dark:from-orange-950/20 dark:to-gray-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto h-8 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto mt-4 h-10 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

function renderSection(key: string, parallaxImageUrl: string, heroData: HeroData | null) {
  switch (key) {
    case "hero": {
      return <HeroSection heroData={heroData} />;
    }
    case "upcoming_events": {
      return (
        <Suspense fallback={<BentoEventsSkeleton />}>
          <BentoEventsSection />
        </Suspense>
      );
    }
    case "strava_showcase": {
      return (
        <Suspense fallback={<StravaShowcaseSkeleton />}>
          <StravaShowcaseSection />
        </Suspense>
      );
    }
    case "how_it_works": {
      return <HowItWorksSection />;
    }
    case "feed_showcase": {
      return (
        <Suspense fallback={<ParallaxMountain imageUrl={parallaxImageUrl} />}>
          <FeedShowcaseSection imageUrl={parallaxImageUrl} />
        </Suspense>
      );
    }
    case "gamification": {
      return (
        <Suspense fallback={<GamificationSkeleton />}>
          <GamificationSection />
        </Suspense>
      );
    }
    case "categories": {
      return <CategoriesSection />;
    }
    case "organizers": {
      return (
        <Suspense fallback={<OrganizersSkeleton />}>
          <OrganizersSection />
        </Suspense>
      );
    }
    case "testimonials": {
      return (
        <Suspense fallback={<TestimonialsSkeleton />}>
          <TestimonialsSection />
        </Suspense>
      );
    }
    case "faq": {
      return <FAQSection />;
    }
    case "contact_cta": {
      return <ContactCTASection />;
    }
    default: {
      return null;
    }
  }
}

interface HeroData {
  slides: { image: { url: string; mobileUrl?: string; alt: string } }[];
}

export default async function Home() {
  const [heroData, settings, sectionsData] = await Promise.all([
    getCachedHeroCarousel(),
    getCachedSiteSettings(),
    getCachedHomepageSections(),
  ]);

  const heroSlides = parseHeroSlides(heroData);
  const transformedHeroData: HeroData | null =
    heroSlides.length > 0
      ? {
          slides: heroSlides.map((s) => ({
            image: { url: s.url, mobileUrl: s.mobileUrl, alt: s.alt },
          })),
        }
      : null;
  const parallaxImageUrl =
    settings?.parallax_image_url ??
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";

  const cmsSections = parseHomepageSections(sectionsData);
  const sections = cmsSections.length > 0 ? cmsSections : DEFAULT_SECTIONS;
  const enabledSections = sections.filter((s) => s.enabled);

  return (
    <main>
      <EntryBanner />

      {enabledSections.map((section) => (
        <div key={section.key}>
          {renderSection(section.key, parallaxImageUrl, transformedHeroData)}
        </div>
      ))}

      <OrganizerWaitlistModal />
    </main>
  );
}
