import { Suspense } from "react";

import AppPreviewSection from "@/components/landing/AppPreviewSection";
import BentoEventsSection from "@/components/landing/BentoEventsSection";
import ClubsSection from "@/components/landing/ClubsSection";
import CocoDemoSection from "@/components/landing/CocoDemoSection";
import ContactCTASection from "@/components/landing/ContactCTASection";
import FAQSection from "@/components/landing/FAQSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FullBleedCTASection from "@/components/landing/FullBleedCTASection";
import HeroSection from "@/components/landing/HeroSection";
import PioneerCounterSection from "@/components/landing/PioneerCounterSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WaitlistSection from "@/components/landing/WaitlistSection";

interface HeroData {
  slides: { image: { url: string; mobileUrl?: string; alt: string } }[];
}

interface NewLandingPageProps {
  heroData: HeroData | null;
}

export default function NewLandingPage({ heroData }: NewLandingPageProps) {
  return (
    <>
      <HeroSection heroData={heroData} />
      <AppPreviewSection />
      <CocoDemoSection />
      <FullBleedCTASection />
      <Suspense>
        <ClubsSection />
      </Suspense>
      <Suspense>
        <BentoEventsSection />
      </Suspense>
      <FeaturesSection />
      <Suspense>
        <TestimonialsSection />
      </Suspense>
      <PioneerCounterSection />
      <FAQSection />
      <WaitlistSection />
      <ContactCTASection />
    </>
  );
}
