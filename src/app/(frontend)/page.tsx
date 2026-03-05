import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import EntryBanner from "@/components/landing/EntryBanner";
import FeedShowcaseSection from "@/components/landing/FeedShowcaseSection";
import GamificationSection from "@/components/landing/GamificationSection";
import HeroSection from "@/components/landing/HeroSection";
import OrganizersSection from "@/components/landing/OrganizersSection";
import OrganizerWaitlistModal from "@/components/landing/OrganizerWaitlistModal";
import ParallaxMountain from "@/components/landing/ParallaxMountain";
import StravaShowcaseSection from "@/components/landing/StravaShowcaseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import UpcomingEventsSection from "@/components/landing/UpcomingEventsSection";
import { getCachedHeroCarousel, getCachedSiteSettings, parseHeroSlides } from "@/lib/cms/cached";

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

const categories = [
  {
    name: "Hiking",
    slug: "hiking",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1280&h=200&fit=crop",
  },
  {
    name: "Mountain Biking",
    slug: "mtb",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1280&h=200&fit=crop",
  },
  {
    name: "Road Biking",
    slug: "road_bike",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1280&h=200&fit=crop",
  },
  {
    name: "Running",
    slug: "running",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1280&h=200&fit=crop",
  },
  {
    name: "Trail Running",
    slug: "trail_run",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1280&h=200&fit=crop",
  },
];

const steps = [
  {
    icon: "\u{1F50D}",
    title: "Browse Events",
    description: "Discover adventure events happening near you or across the country.",
  },
  {
    icon: "\u{1F3AB}",
    title: "Book Your Spot",
    description: "Reserve your slot in seconds. No hassle, no long forms.",
  },
  {
    icon: "\u{1F3D4}\uFE0F",
    title: "Go Adventure!",
    description: "Show up, have fun, and collect badges for your achievements.",
  },
];

function UpcomingEventsSkeleton() {
  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="h-9 w-56 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[320px] h-[340px] bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse flex-shrink-0"
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

export default async function Home() {
  const [heroData, settings] = await Promise.all([
    getCachedHeroCarousel(),
    getCachedSiteSettings(),
  ]);
  const heroSlides = parseHeroSlides(heroData);
  const transformedHeroData =
    heroSlides.length > 0
      ? { slides: heroSlides.map((s) => ({ image: { url: s.url, alt: s.alt } })) }
      : null;
  const parallaxImageUrl =
    settings?.parallax_image_url ||
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";

  return (
    <main>
      <EntryBanner />

      {/* Hero Section — renders immediately with pre-fetched data */}
      <HeroSection heroData={transformedHeroData} />

      {/* Upcoming Events — streams as Supabase data arrives */}
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <UpcomingEventsSection />
      </Suspense>

      {/* Strava Showcase — feature-flagged sub-sections */}
      <Suspense
        fallback={
          <div className="bg-gradient-to-b from-orange-50/60 to-white py-16 dark:from-orange-950/20 dark:to-gray-950 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 text-center">
                <div className="mx-auto h-8 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="mx-auto mt-4 h-10 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        }
      >
        <StravaShowcaseSection />
      </Suspense>

      {/* How It Works — static, renders immediately */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax mountain reveal — with feed showcase revealed on scroll */}
      <Suspense fallback={<ParallaxMountain imageUrl={parallaxImageUrl} />}>
        <FeedShowcaseSection imageUrl={parallaxImageUrl} />
      </Suspense>

      {/* Gamification Showcase — streams as Supabase data arrives */}
      <Suspense fallback={<GamificationSkeleton />}>
        <GamificationSection />
      </Suspense>

      {/* Event Categories — static images, renders immediately */}
      <section className="py-12 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
            Find Your Adventure
          </h2>
          <div className="flex flex-col gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/events?type=${cat.slug}`}
                className="relative h-32 sm:h-40 rounded-2xl overflow-hidden group"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1280px) 95vw, 1280px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  quality={50}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center px-6">
                  <h3 className="text-white font-heading font-bold text-xl sm:text-2xl drop-shadow-lg">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Organizers — streams as Supabase data arrives */}
      <Suspense fallback={<OrganizersSkeleton />}>
        <OrganizersSection />
      </Suspense>

      {/* Participant Testimonials — streams as Supabase data arrives */}
      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection />
      </Suspense>

      {/* Organizer Waitlist Modal */}
      <OrganizerWaitlistModal />

      {/* FAQ Section — static with JSON-LD */}
      <FAQSection />

      {/* Contact CTA — static */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            Have Questions?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Whether you need help with an event, have a partnership idea, or just want to say hello
            — we&apos;re here for you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}

const faqs = [
  {
    question: "What types of events are available on EventTara?",
    answer:
      "EventTara features outdoor adventure events including hiking, trail running, mountain biking, road cycling, and running events across Panay Island and beyond.",
  },
  {
    question: "How do I book an event?",
    answer:
      "Browse available events, select the one you want to join, and click the Book button. You can pay online or choose cash payment at the event. Your spot is reserved immediately.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Yes, you can cancel your booking from the My Events page. Cancellation policies may vary by event, so check the event details for specifics.",
  },
  {
    question: "What are badges and how do I earn them?",
    answer:
      "Badges are collectible achievements you earn by participating in events and completing milestones. Check in at events to automatically earn badges. View your collection on your profile page.",
  },
  {
    question: "How do I become an event organizer?",
    answer:
      "Sign up for a free account and create your first event. You will automatically become an organizer with access to the organizer dashboard for managing events, check-ins, and participants.",
  },
  {
    question: "Is EventTara free to use?",
    answer:
      "Yes, creating an account and browsing events is completely free. Event prices are set by individual organizers and vary by event.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function FAQSection() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
          Everything you need to know about EventTara.
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-gray-950/20"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-900 dark:text-white list-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="ml-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180">
                  &#9662;
                </span>
              </summary>
              <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
