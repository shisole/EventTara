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
import ScrollReveal from "@/components/landing/ScrollReveal";
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
      <ScrollReveal>
        <AppPreviewSection />
      </ScrollReveal>
      <ScrollReveal>
        <CocoDemoSection />
      </ScrollReveal>
      <ScrollReveal>
        <FullBleedCTASection />
      </ScrollReveal>
      <ScrollReveal>
        <Suspense>
          <ClubsSection />
        </Suspense>
      </ScrollReveal>
      <ScrollReveal>
        <Suspense>
          <BentoEventsSection />
        </Suspense>
      </ScrollReveal>
      <ScrollReveal>
        <FeaturesSection />
      </ScrollReveal>
      <ScrollReveal>
        <Suspense>
          <TestimonialsSection />
        </Suspense>
      </ScrollReveal>
      <ScrollReveal>
        <PioneerCounterSection />
      </ScrollReveal>
      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>
      <ScrollReveal>
        <WaitlistSection />
      </ScrollReveal>
      <ScrollReveal>
        <ContactCTASection />
      </ScrollReveal>
    </>
  );
}
