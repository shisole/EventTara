import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import BetaNoticeModal from "@/components/landing/BetaNoticeModal";
import GamificationSection from "@/components/landing/GamificationSection";
import HeroSection from "@/components/landing/HeroSection";
import OrganizersSection from "@/components/landing/OrganizersSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import UpcomingEventsSection from "@/components/landing/UpcomingEventsSection";
import { getCachedHeroCarousel } from "@/lib/payload/cached";

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
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1280&h=320&fit=crop",
  },
  {
    name: "Mountain Biking",
    slug: "mtb",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1280&h=320&fit=crop",
  },
  {
    name: "Road Biking",
    slug: "road_bike",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1280&h=320&fit=crop",
  },
  {
    name: "Running",
    slug: "running",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1280&h=320&fit=crop",
  },
  {
    name: "Trail Running",
    slug: "trail_run",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1280&h=320&fit=crop",
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
    <section className="py-20 bg-white dark:bg-slate-800">
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
    <section className="py-16 bg-white dark:bg-slate-800">
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
    <section className="py-20 bg-gray-50 dark:bg-slate-900">
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
    <section className="py-20 bg-gray-50 dark:bg-slate-900">
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
  const heroData = await getCachedHeroCarousel();

  return (
    <main>
      <BetaNoticeModal />

      {/* Hero Section — renders immediately with pre-fetched data */}
      <HeroSection heroData={heroData} />

      {/* Upcoming Events — streams as Supabase data arrives */}
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <UpcomingEventsSection />
      </Suspense>

      {/* How It Works — static, renders immediately */}
      <section className="py-20 bg-white dark:bg-slate-800">
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

      {/* Gamification Showcase — streams as Supabase data arrives */}
      <Suspense fallback={<GamificationSkeleton />}>
        <GamificationSection />
      </Suspense>

      {/* Event Categories — static images, renders immediately */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
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
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
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

      {/* Organizer CTA — static */}
      <section className="py-20 bg-lime-400 dark:bg-lime-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 mb-4">
            Run Adventure Events?
          </h2>
          <p className="text-lg text-slate-700 dark:text-gray-800 mb-8">
            List them on EventTara and reach thousands of adventure seekers. Manage registrations,
            check-ins, and more — all in one place.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-slate-900 text-lime-400 hover:bg-slate-800 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Contact CTA — static */}
      <section className="py-20 bg-white dark:bg-slate-800">
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
