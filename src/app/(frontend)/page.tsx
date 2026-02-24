import Image from "next/image";
import Link from "next/link";

import EventCard from "@/components/events/EventCard";
import EventCarousel from "@/components/events/EventCarousel";
import BetaNoticeModal from "@/components/landing/BetaNoticeModal";
import HeroCarousel from "@/components/landing/HeroCarousel";
import HostEventLink from "@/components/landing/HostEventLink";
import { Avatar } from "@/components/ui";
import { getPayloadClient } from "@/lib/payload/client";
import { createClient } from "@/lib/supabase/server";

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

export const revalidate = 60;

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

export default async function Home() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [
    { count: totalUpcoming },
    { data: upcomingEvents },
    { data: organizers },
    { data: testimonials },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("date", now),
    supabase
      .from("events")
      .select("*, bookings(count), organizer_profiles!inner(org_name)")
      .eq("status", "published")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(5),
    supabase
      .from("organizer_profiles")
      .select("id, org_name, logo_url, events!inner(id)")
      .eq("events.status", "published")
      .limit(12),
    supabase
      .from("app_testimonials")
      .select("id, name, role, text, avatar_url")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(6),
  ]);

  const remainingCount = (totalUpcoming || 0) - (upcomingEvents?.length || 0);

  // Dedupe (inner join can return multiples) and sort by event count
  const uniqueOrganizers = organizers
    ? Object.values(
        organizers.reduce<
          Record<
            string,
            { id: string; org_name: string; logo_url: string | null; event_count: number }
          >
        >((acc, org: any) => {
          if (!acc[org.id]) {
            acc[org.id] = {
              id: org.id,
              org_name: org.org_name,
              logo_url: org.logo_url,
              event_count: 0,
            };
          }
          acc[org.id].event_count += Array.isArray(org.events) ? org.events.length : 1;
          return acc;
        }, {}),
      ).sort((a, b) => b.event_count - a.event_count)
    : [];

  // Fetch hero carousel images from Payload CMS
  let heroSlides: { image: { url: string; alt: string } }[] = [];
  try {
    const payload = await getPayloadClient();
    const heroData = await payload.findGlobal({ slug: "hero-carousel" });
    if (heroData?.slides) {
      heroSlides = heroData.slides
        .filter((slide: any) => slide.image && typeof slide.image === "object")
        .map((slide: any) => ({
          image: {
            url: slide.image.url,
            alt: slide.image.alt || "Adventure",
          },
        }));
    }
  } catch {
    // Fallback: no carousel images
  }

  return (
    <main>
      <BetaNoticeModal />

      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden min-h-[500px] flex items-center">
        {heroSlides.length > 0 ? (
          <HeroCarousel slides={heroSlides} />
        ) : (
          <>
            {/* Fallback: original flat background */}
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

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="py-20 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white">
                Upcoming Events
              </h2>
              <Link
                href="/events?when=upcoming"
                className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
              >
                View all
              </Link>
            </div>
            <EventCarousel>
              {upcomingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="md:min-w-[320px] md:max-w-[350px] md:flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <EventCard
                    id={event.id}
                    title={event.title}
                    type={event.type}
                    date={event.date}
                    location={event.location}
                    price={Number(event.price)}
                    cover_image_url={event.cover_image_url}
                    max_participants={event.max_participants}
                    booking_count={event.bookings?.[0]?.count || 0}
                    organizer_name={event.organizer_profiles?.org_name}
                    organizer_id={event.organizer_id}
                    status="upcoming"
                  />
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className="md:min-w-[280px] md:flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <Link
                    href="/events"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-lime-500 dark:hover:border-lime-500 transition-colors h-full min-h-[280px]"
                  >
                    <span className="text-3xl font-heading font-bold text-lime-600 dark:text-lime-400">
                      +{remainingCount}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      more events
                    </span>
                  </Link>
                </div>
              )}
            </EventCarousel>
          </div>
        </section>
      )}

      {/* How It Works */}
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

      {/* Event Categories */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
            Find Your Adventure
          </h2>
          <div className="flex flex-col gap-4">
            {categories.map((cat) => (
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

      {/* Trusted Organizers */}
      {uniqueOrganizers.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-8">
              Trusted by Organizers
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {uniqueOrganizers.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizers/${org.id}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <Avatar
                    src={org.logo_url}
                    alt={org.org_name}
                    size="lg"
                    className="ring-2 ring-transparent group-hover:ring-lime-500 transition-all group-hover:scale-110"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors font-medium max-w-[80px] text-center truncate">
                    {org.org_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Participant Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
              What Adventurers Say
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Hear from the community that makes EventTara special.
            </p>
            <EventCarousel infinite speed={30}>
              {testimonials.map((t: any) => (
                <div key={t.id} className="min-w-[300px] max-w-[380px] flex-shrink-0">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-950/20 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {t.avatar_url ? (
                          <Image
                            src={t.avatar_url}
                            alt={t.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-lime-600 dark:text-lime-400 font-bold text-sm">
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </EventCarousel>
          </div>
        </section>
      )}

      {/* Organizer CTA */}
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
    </main>
  );
}
