import Image from "next/image";

const SCREENSHOTS = [
  {
    title: "Discover Events",
    description: "Browse outdoor adventures near you",
    src: "/images/preview-events.png",
    alt: "EventTara events listing page",
  },
  {
    title: "Book Instantly",
    description: "Reserve your spot in seconds",
    src: "/images/preview-booking.png",
    alt: "EventTara booking flow",
  },
  {
    title: "Earn Badges",
    description: "Track achievements and climb the leaderboard",
    src: "/images/preview-profile.png",
    alt: "EventTara profile with badges",
  },
];

export default function AppPreviewSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 dark:bg-slate-900">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SCREENSHOTS.map((screenshot, i) => (
            <div key={i} className="group">
              {/* Browser frame */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-950/50 overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform duration-300 group-hover:-translate-y-1">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-400 dark:text-gray-500 text-center">
                      eventtara.com
                    </div>
                  </div>
                </div>

                {/* Screenshot area */}
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Fallback gradient if image doesn't exist */}
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-teal-500/5" />
                </div>
              </div>

              {/* Caption */}
              <div className="mt-4 text-center">
                <h3 className="font-heading font-bold text-gray-900 dark:text-white">
                  {screenshot.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{screenshot.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
