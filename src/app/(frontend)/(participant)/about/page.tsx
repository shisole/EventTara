import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import JourneyStepGallery from "@/components/about/JourneyStepGallery";
import { Breadcrumbs } from "@/components/ui";
import PageShareButtons from "@/components/ui/PageShareButtons";

export const metadata: Metadata = {
  title: "About EventTara - Built by a Hiker in Iloilo | Stephen Hisole",
  description:
    "The story of how EventTara started from one hiker's journey through Panay Island's trails - from Mt. Igatmon to building a platform for adventurers across the Philippines.",
  openGraph: {
    title: "About EventTara - Built by a Hiker in Iloilo",
    description: "From two bikes to every mountain - the story behind EventTara.",
    images: ["/images/about/hero.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] flex items-center justify-center">
        <Image
          src="/images/about/hero.jpg"
          alt="Trail running in Panay Island"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
            From Two Bikes to Every Mountain
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto">
            How one hiker&apos;s journey through Iloilo&apos;s trails became EventTara
          </p>
        </div>
      </section>

      {/* Breadcrumbs & Share */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Breadcrumbs />
        <PageShareButtons title="About EventTara - Built by a Hiker in Iloilo" path="/about" />
      </div>

      {/* The Journey Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-12 text-center">
            The Journey
          </h2>

          {/* 2019-2022: The Beginning */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                  2019-2022: The Beginning
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  My fitness journey started during the pandemic when I bought my first bike—a
                  mountain bike that opened up a whole new world. I fell in love with the sport so
                  deeply that I upgraded every single part until it wasn&apos;t the bike it was
                  before.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Eventually, I bought a second bike—this time a road bike. One for the roads, one
                  for the trails. Long road rides and exciting trail rides became my escape during
                  those isolated years.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <JourneyStepGallery
                  images={[
                    { src: "/images/about/mtb-trail.jpg", alt: "Mountain biking on Panay trails" },
                    {
                      src: "/images/about/gallery-roadbike.jpg",
                      alt: "Road cycling along Iloilo coast",
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* 2024: Crossfit to Running */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                  2024: Crossfit to Running
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  In 2024, I joined Ironforge Crossfit in Iloilo. That&apos;s where I learned to
                  run—it was part of the routine. I started with a 3km charity run, then The
                  Imperial Run 10km got me completely hooked.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  One week later, I jumped to the UP Run 21km. Then came the Bucari Extreme Trail
                  Run—27 grueling kilometers organized by PESEC (Philippine Extreme Sports and
                  Events Collective). That trail run changed everything.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <JourneyStepGallery
                  images={[
                    { src: "/images/about/imperial-run.jpg", alt: "Finishing The Imperial Run" },
                    {
                      src: "/images/about/gallery-bucari.jpg",
                      alt: "Bucari Extreme 27km trail run",
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* 2024: Discovering Hiking */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                  2024: Discovering Hiking
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  I started hiking to prepare for the Bucari trail run. My first hike was Mt.
                  Igatmon in Igbaras—I call it my &quot;mother mountain.&quot; Standing at that
                  summit, I knew I had found something special.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Every weekend brought a new mountain: Mt. Napulak, Mt. Loboc, Mt. Taripis, Mt.
                  Lingguhob, Mt. Opao, Mt. Pulang Lupa. I joined hiking groups—Journey Through
                  Trails (JTT), Rubo-rubo lang, Five Thirsty Trekkers, and Yenergy Outdoors. I found
                  my community.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <JourneyStepGallery
                  images={[
                    { src: "/images/about/hiking-igatmon.jpg", alt: "Summit of Mt. Igatmon" },
                    { src: "/images/about/hiking-napulak.jpg", alt: "Summit of Mt. Napulak" },
                    { src: "/images/about/hiking-loboc.jpg", alt: "Summit of Mt. Loboc" },
                    { src: "/images/about/hiking-taripis.jpg", alt: "Hiking Mt. Taripis" },
                    { src: "/images/about/hiking-opao.jpg", alt: "Summit of Mt. Opao" },
                    {
                      src: "/images/about/hiking-pulang-lupa.jpg",
                      alt: "Summit of Mt. Pulang Lupa",
                    },
                    {
                      src: "/images/about/hiking-bato-igmatindog.jpg",
                      alt: "Bato Igmatindog",
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* January 2025: The Turning Point */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                  January 2025: The Turning Point
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  In August 2024, I signed up for the 42km Iloilo Dinagyang Marathon. My goal:
                  finish the &quot;running era&quot; with a full marathon. But two days before the
                  race, my grandfather passed away.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  I almost backed out. No training. Deep grief. Bad condition. But I grabbed myself
                  and showed up to that race as a tribute to my late grandfather. I finished in
                  7:59:01—dead last, 159th out of 159 runners. But I finished.
                </p>
                <p className="text-gray-600 dark:text-gray-400 italic">
                  &quot;When you&apos;re grieving, anything is possible.&quot;
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <JourneyStepGallery
                  images={[
                    {
                      src: "/images/about/marathon-stats.jpg",
                      alt: "42km Dinagyang Marathon finish certificate",
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Present: Builder */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2">
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                  Present: From Runner to Hiker to Builder
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  That 42km was my last run event. These days, I&apos;m hiking full-time. But I kept
                  running into the same problem: finding events was a pain.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Every weekend, I&apos;d scroll through dozens of Facebook groups, DM organizers to
                  check availability, compare prices manually, and hope I didn&apos;t miss
                  registration deadlines. There was no central place to see what&apos;s happening in
                  Panay Island. I knew there had to be a better way.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <JourneyStepGallery
                  images={[
                    { src: "/images/about/recent-hike.jpg", alt: "Recent hiking adventure" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
            The Problem
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Every weekend, I&apos;d scroll through dozens of Facebook groups trying to find hiking
            events. I&apos;d DM organizers to check availability, compare prices manually, and hope
            I didn&apos;t miss registration deadlines. There was no central place to see what&apos;s
            happening in Panay Island. As both a participant and someone who wanted to support local
            organizers, I knew there had to be a better way.
          </p>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
            The Solution
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            EventTara started as a weekend project in my room in Iloilo. A simple platform to find
            and book outdoor events—built by someone who lives this life, for others like me. No
            corporate backing, no big team. Just a hiker who codes and wanted to solve a problem I
            faced every week.
          </p>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
            The Vision
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            We&apos;re starting here in Panay Island—my home trails, my community. Every mountain
            I&apos;ve climbed, every organizer I&apos;ve met, every group I&apos;ve joined. Once we
            prove it works here, we&apos;ll grow across Visayas and eventually the entire
            Philippines. But we&apos;ll always remember: we&apos;re built <em>by</em> the outdoor
            community, <em>for</em> the outdoor community.
          </p>
        </div>
      </section>

      {/* From the Trails - Photo Gallery */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4 text-center">
            From the Trails
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 text-center max-w-2xl mx-auto">
            Moments from the journey that led to EventTara
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Photo 1 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-bucari.jpg"
                alt="Bucari Extreme 27km finish line"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">Bucari Extreme 27km - my first trail run</p>
              </div>
            </div>

            {/* Photo 2 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-napulak.jpg"
                alt="Summit of Mt. Napulak"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">
                  Mt. Napulak - chasing new summits every weekend
                </p>
              </div>
            </div>

            {/* Photo 3 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-mtb.jpg"
                alt="Mountain biking on Panay trails"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">Early days on the trails of Panay</p>
              </div>
            </div>

            {/* Photo 4 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-taripis.jpg"
                alt="Hiking Mt. Taripis trail"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">
                  Mt. Taripis - exploring Panay&apos;s hidden trails
                </p>
              </div>
            </div>

            {/* Photo 5 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-roadbike.jpg"
                alt="Road cycling along Iloilo coast"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">Long rides along Iloilo&apos;s coast</p>
              </div>
            </div>

            {/* Photo 6 */}
            <div className="relative group">
              <Image
                src="/images/about/gallery-imperial.jpg"
                alt="Imperial Run with running club"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
                <p className="text-white font-medium">With the Iloilo outdoor community</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-lime-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4">
            Join me on this journey
          </h2>
          <p className="text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re in Iloilo or anywhere in the Philippines, let&apos;s make finding
            your next adventure easier. Tara na!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              Browse Events
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-lg hover:bg-gray-100 transition-colors w-full sm:w-auto"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
