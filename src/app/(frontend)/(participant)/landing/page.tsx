import { Suspense } from "react";

import AppPreviewSection from "@/components/landing/AppPreviewSection";
import BentoEventsSection from "@/components/landing/BentoEventsSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import ClubsSection from "@/components/landing/ClubsSection";
import ContactCTASection from "@/components/landing/ContactCTASection";
import FAQSection from "@/components/landing/FAQSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PioneerCounterSection from "@/components/landing/PioneerCounterSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import { getCachedHeroCarousel, parseHeroSlides } from "@/lib/cms/cached";

export const metadata = {
  title: "EventTara — Landing Page Preview",
  robots: { index: false, follow: false },
};

interface HeroData {
  slides: { image: { url: string; mobileUrl?: string; alt: string } }[];
}

export default async function LandingPreview() {
  const heroData = await getCachedHeroCarousel();
  const heroSlides = parseHeroSlides(heroData);
  const transformedHeroData: HeroData | null =
    heroSlides.length > 0
      ? {
          slides: heroSlides.map((s) => ({
            image: { url: s.url, mobileUrl: s.mobileUrl, alt: s.alt },
          })),
        }
      : null;

  return (
    <main>
      <HeroSection heroData={transformedHeroData} />
      <AppPreviewSection />
      <Suspense>
        <ClubsSection />
      </Suspense>
      <Suspense>
        <BentoEventsSection />
      </Suspense>
      <CategoriesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <Suspense>
        <TestimonialsSection />
      </Suspense>
      <PioneerCounterSection />
      <FAQSection />
      <WaitlistSection />
      <ContactCTASection />
    </main>
  );
}
