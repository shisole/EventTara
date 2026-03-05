import { type Metadata } from "next";
import Image from "next/image";

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

      {/* The Journey Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-12 text-center">
            The Journey
          </h2>

          {/* 2019-2022: The Beginning */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="md:w-1/2">
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
              <div className="md:w-1/2">
                <Image
                  src="/images/about/mtb-trail.jpg"
                  alt="Mountain biking on Panay trails"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* 2024: Crossfit to Running */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
              <div className="md:w-1/2">
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
              <div className="md:w-1/2">
                <Image
                  src="/images/about/imperial-run.jpg"
                  alt="Finishing The Imperial Run"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* 2024: Discovering Hiking */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="md:w-1/2">
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
              <div className="md:w-1/2">
                <Image
                  src="/images/about/mt-igatmon.jpg"
                  alt="Summit of Mt. Igatmon, Igbaras"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* January 2025: The Turning Point */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
              <div className="md:w-1/2">
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
              <div className="md:w-1/2">
                <Image
                  src="/images/about/marathon-stats.jpg"
                  alt="42km Dinagyang Marathon finish certificate"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Present: Builder */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="md:w-1/2">
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
              <div className="md:w-1/2">
                <Image
                  src="/images/about/recent-hike.jpg"
                  alt="Recent hiking adventure"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
