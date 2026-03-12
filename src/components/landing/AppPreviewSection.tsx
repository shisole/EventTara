import { cn } from "@/lib/utils";

const QR_PATTERN = [
  1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1,
  0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl ring-1 ring-white/10">
      <div className="flex justify-center pt-1.5 pb-1">
        <div className="w-16 h-4 bg-black rounded-full" />
      </div>
      <div className="bg-white rounded-[2rem] overflow-hidden" style={{ aspectRatio: "9/19" }}>
        {children}
      </div>
      <div className="flex justify-center py-1.5">
        <div className="w-20 h-1 bg-slate-600 rounded-full" />
      </div>
    </div>
  );
}

function EventsScreen() {
  return (
    <div className="h-full flex flex-col p-3 bg-gray-50 text-[10px]">
      <div className="text-center font-bold text-[11px] text-gray-900 mb-2">Explore Events</div>
      <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1.5 text-gray-400 text-[9px] shadow-sm mb-2">
        <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Search events...
      </div>
      <div className="flex gap-1 mb-2">
        <span className="px-1.5 py-0.5 bg-lime-500 text-white rounded-full text-[8px] font-semibold">
          Hiking
        </span>
        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[8px]">MTB</span>
        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[8px]">
          Running
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {[
          {
            name: "Mt. Pulag Day Hike",
            date: "Mar 15",
            loc: "Benguet",
            color: "bg-emerald-400",
            spots: 8,
          },
          {
            name: "Rizal Trail Run",
            date: "Mar 22",
            loc: "Tanay",
            color: "bg-orange-400",
            spots: 12,
          },
          {
            name: "Clark MTB Ride",
            date: "Apr 5",
            loc: "Pampanga",
            color: "bg-blue-400",
            spots: 5,
          },
        ].map((evt) => (
          <div key={evt.name} className="bg-white rounded-lg shadow-sm overflow-hidden flex">
            <div className={cn("w-1 shrink-0", evt.color)} />
            <div className="p-1.5 flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{evt.name}</div>
              <div className="text-gray-500 text-[8px]">
                {evt.date} &middot; {evt.loc}
              </div>
              <div className="text-lime-600 text-[8px] font-medium mt-0.5">
                {evt.spots} spots left
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50 text-[10px]">
      <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center mb-2">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="font-bold text-gray-900 text-[11px] mb-0.5">Booking Confirmed!</div>
      <div className="text-gray-500 text-[8px] mb-3">You&apos;re all set for your adventure</div>

      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 text-center">
          <div className="font-semibold text-gray-900 text-[10px]">Mt. Pulag Day Hike</div>
          <div className="text-gray-500 text-[8px] mt-0.5">Mar 15, 2026 &middot; 5:00 AM</div>
          <div className="text-gray-500 text-[8px]">Benguet, Philippines</div>
        </div>
        <div className="relative border-t border-dashed border-gray-200 mx-2">
          <div className="absolute -left-3.5 -top-1.5 w-3 h-3 rounded-full bg-gray-50" />
          <div className="absolute -right-3.5 -top-1.5 w-3 h-3 rounded-full bg-gray-50" />
        </div>
        <div className="p-3 flex flex-col items-center">
          <div className="grid grid-cols-7 gap-[1px] w-14 h-14 mb-1.5">
            {QR_PATTERN.map((v, i) => (
              <div key={i} className={v ? "bg-gray-900 rounded-[0.5px]" : "bg-transparent"} />
            ))}
          </div>
          <div className="text-gray-400 text-[8px]">Ticket #ET-2847</div>
        </div>
      </div>

      <div className="mt-3 px-4 py-1.5 bg-lime-500 text-white rounded-lg text-[9px] font-semibold">
        View My Bookings
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="h-full flex flex-col p-3 bg-gray-50 text-[10px]">
      <div className="flex flex-col items-center pt-2 pb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 ring-2 ring-lime-300 flex items-center justify-center text-white font-bold text-sm mb-1.5">
          JD
        </div>
        <div className="font-bold text-gray-900 text-[11px]">Juan Dela Cruz</div>
        <div className="text-gray-500 text-[8px]">@juantrails</div>
      </div>

      <div className="grid grid-cols-3 gap-1 mb-3">
        {[
          { value: "12", label: "Events" },
          { value: "8", label: "Badges" },
          { value: "3", label: "Clubs" },
        ].map((stat) => (
          <div key={stat.label} className="text-center bg-white rounded-lg py-1.5 shadow-sm">
            <div className="font-bold text-gray-900 text-[11px]">{stat.value}</div>
            <div className="text-gray-500 text-[7px]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="font-semibold text-gray-900 text-[9px] mb-1.5">Recent Badges</div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { emoji: "\u{1F97E}", label: "First Hike", bg: "bg-emerald-100" },
          { emoji: "\u26F0\uFE0F", label: "Summit", bg: "bg-blue-100" },
          { emoji: "\u{1F3C5}", label: "5 Events", bg: "bg-amber-100" },
          { emoji: "\u{1F6B5}", label: "MTB Rider", bg: "bg-orange-100" },
          { emoji: "\u{1F3AF}", label: "Check-in", bg: "bg-purple-100" },
          { emoji: "\u2B50", label: "Top 10", bg: "bg-yellow-100" },
        ].map((badge) => (
          <div key={badge.label} className={cn("rounded-lg py-1.5 text-center", badge.bg)}>
            <div className="text-sm leading-none">{badge.emoji}</div>
            <div className="text-[7px] text-gray-600 mt-0.5 font-medium">{badge.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  {
    title: "Book Instantly",
    description: "Reserve your spot in seconds",
    screen: <BookingScreen />,
  },
  {
    title: "Discover Events",
    description: "Browse outdoor adventures near you",
    screen: <EventsScreen />,
  },
  {
    title: "Earn Badges",
    description: "Track achievements and climb the leaderboard",
    screen: <ProfileScreen />,
  },
];

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

        <div className="flex justify-center items-start gap-4 sm:gap-6 lg:gap-10">
          {SCREENS.map((item, i) => (
            <div
              key={item.title}
              className={cn("text-center", i === 1 ? "z-10" : "mt-8 sm:mt-12 hidden sm:block")}
            >
              <div className="w-[200px] lg:w-[240px]">
                <PhoneFrame>{item.screen}</PhoneFrame>
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
