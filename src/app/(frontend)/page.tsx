import { Suspense } from "react";

import AppPreviewSection from "@/components/landing/AppPreviewSection";
import BentoEventsSection from "@/components/landing/BentoEventsSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import ClubsSection from "@/components/landing/ClubsSection";
import CocoDemoSection from "@/components/landing/CocoDemoSection";
import ContactCTASection from "@/components/landing/ContactCTASection";
import FAQSection from "@/components/landing/FAQSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FeedShowcaseSection from "@/components/landing/FeedShowcaseSection";
import FullBleedCTASection from "@/components/landing/FullBleedCTASection";
import GamificationSection from "@/components/landing/GamificationSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LeaderboardPreviewSection from "@/components/landing/LeaderboardPreviewSection";
import ParallaxMountain from "@/components/landing/ParallaxMountain";
import PioneerCounterSection from "@/components/landing/PioneerCounterSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import StravaShowcaseSection from "@/components/landing/StravaShowcaseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import {
  getCachedHeroCarousel,
  getCachedHomepageSections,
  getCachedSiteSettings,
  parseHeroSlides,
  parseHomepageSections,
} from "@/lib/cms/cached";
import { type CmsHomepageSection } from "@/lib/cms/types";

export const metadata = {
  title: "EventTara — Every Great Adventure Starts Here",
  description:
    "Discover outdoor events, join adventure clubs, and book your spot — hiking, biking, running, and trail running across the Philippines, all in one place.",
  openGraph: {
    title: "EventTara — Every Great Adventure Starts Here",
    description:
      "Discover outdoor events, join adventure clubs, and book your spot across the Philippines. Hiking, biking, running, and trail running — all in one place.",
    type: "website" as const,
  },
};

export const revalidate = 300;

const DEFAULT_SECTIONS: CmsHomepageSection[] = [
  { key: "hero", label: "Hero", enabled: true, order: 0 },
  { key: "coco_demo", label: "Coco Demo", enabled: true, order: 1 },
  { key: "full_bleed_cta", label: "Full Bleed CTA", enabled: true, order: 2 },
  { key: "clubs", label: "Community Clubs", enabled: true, order: 3 },
  { key: "upcoming_events", label: "Upcoming Events", enabled: true, order: 4 },
  { key: "features", label: "Features", enabled: true, order: 5 },
  { key: "testimonials", label: "Testimonials", enabled: true, order: 6 },
  { key: "pioneer_counter", label: "Pioneer Counter", enabled: true, order: 7 },
  { key: "faq", label: "FAQ", enabled: true, order: 8 },
  { key: "waitlist", label: "Early Access Waitlist", enabled: true, order: 9 },
  { key: "contact_cta", label: "Contact CTA", enabled: true, order: 10 },
  // Available via CMS but off by default
  { key: "app_preview", label: "App Preview", enabled: false, order: 20 },
  { key: "categories", label: "Event Categories", enabled: false, order: 21 },
  { key: "how_it_works", label: "How It Works", enabled: false, order: 22 },
  { key: "strava_showcase", label: "Strava Showcase", enabled: false, order: 23 },
  { key: "feed_showcase", label: "Activity Feed Showcase", enabled: false, order: 24 },
  { key: "gamification", label: "Badges & Gamification", enabled: false, order: 25 },
  { key: "leaderboard_preview", label: "Leaderboard Preview", enabled: false, order: 26 },
];

interface HeroData {
  slides: { image: { url: string; mobileUrl?: string; alt: string } }[];
}

function renderSection(key: string, parallaxImageUrl: string, heroData: HeroData | null) {
  switch (key) {
    case "hero": {
      return <HeroSection heroData={heroData} />;
    }
    case "coco_demo": {
      return <CocoDemoSection />;
    }
    case "full_bleed_cta": {
      return <FullBleedCTASection />;
    }
    case "app_preview": {
      return <AppPreviewSection />;
    }
    case "features": {
      return <FeaturesSection />;
    }
    case "upcoming_events": {
      return (
        <Suspense>
          <BentoEventsSection />
        </Suspense>
      );
    }
    case "strava_showcase": {
      return (
        <Suspense>
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
        <Suspense>
          <GamificationSection />
        </Suspense>
      );
    }
    case "leaderboard_preview": {
      return (
        <Suspense>
          <LeaderboardPreviewSection />
        </Suspense>
      );
    }
    case "categories": {
      return <CategoriesSection />;
    }
    case "clubs":
    case "organizers": {
      return (
        <Suspense>
          <ClubsSection />
        </Suspense>
      );
    }
    case "pioneer_counter": {
      return <PioneerCounterSection />;
    }
    case "testimonials": {
      return (
        <Suspense>
          <TestimonialsSection />
        </Suspense>
      );
    }
    case "faq": {
      return <FAQSection />;
    }
    case "waitlist": {
      return <WaitlistSection />;
    }
    case "contact_cta": {
      return <ContactCTASection />;
    }
    default: {
      return null;
    }
  }
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
      {enabledSections.map((section) => {
        const content = renderSection(section.key, parallaxImageUrl, transformedHeroData);
        if (!content) return null;

        // Hero renders without ScrollReveal
        if (section.key === "hero") {
          return <div key={section.key}>{content}</div>;
        }

        return (
          <ScrollReveal key={section.key}>
            <div>{content}</div>
          </ScrollReveal>
        );
      })}
    </main>
  );
}
