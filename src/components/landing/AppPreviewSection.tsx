import Image from "next/image";

import { cn } from "@/lib/utils";

const SCREENSHOTS = [
  {
    title: "Discover Events",
    description: "Browse outdoor adventures near you",
    src: "/images/screenshots/events.png",
    alt: "EventTara events listing page showing hiking, biking, and running events",
  },
  {
    title: "Book Your Spot",
    description: "View details and reserve instantly",
    src: "/images/screenshots/event-detail.png",
    alt: "EventTara event detail page with booking and route map",
  },
  {
    title: "Earn Badges",
    description: "Track achievements and climb the leaderboard",
    src: "/images/screenshots/achievements.png",
    alt: "EventTara achievements page showing badges and leaderboards",
  },
];

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/80">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-2 sm:mx-8">
          <div className="bg-slate-700/60 rounded-md px-3 py-1 text-[10px] sm:text-xs text-slate-400 text-center max-w-[200px] mx-auto">
            eventtara.com
          </div>
        </div>
      </div>
      {/* Content */}
      {children}
    </div>
  );
}

export default function AppPreviewSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            See It in Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From discovering your next hike to collecting badges — everything you need for your
            outdoor adventures.
          </p>
        </div>

        <div className="flex justify-center items-start gap-4 sm:gap-6 lg:gap-8">
          {SCREENSHOTS.map((item, i) => (
            <div
              key={item.title}
              className={cn("text-center", i === 1 ? "z-10" : "mt-6 sm:mt-10 hidden sm:block")}
            >
              <div className="w-[280px] sm:w-[260px] lg:w-[340px]">
                <BrowserFrame>
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 280px, (max-width: 1024px) 260px, 340px"
                    />
                  </div>
                </BrowserFrame>
              </div>
              <h3 className="font-heading font-bold text-gray-900 dark:text-white mt-4 text-sm sm:text-base">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
