const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      </svg>
    ),
    title: "Instant Booking",
    description:
      "Browse events and reserve your spot in seconds. No more chasing slots in group chats.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        />
      </svg>
    ),
    title: "QR Check-ins",
    description:
      "Scan in at the event. Organizers get real-time headcounts, participants get verified attendance.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    title: "Badges & Rewards",
    description:
      "Earn badges for milestones, unlock avatar borders, and climb the leaderboard with every adventure.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.2 2.6c.4-.8 1.6-.8 2 0l2.4 4.8 5.4.8c.8.1 1.2 1.1.6 1.7l-3.9 3.8.9 5.3c.1.8-.7 1.5-1.5 1.1L12 17.3l-4.8 2.5c-.8.4-1.7-.3-1.5-1.1l.9-5.3-3.9-3.8c-.6-.6-.2-1.6.6-1.7l5.4-.8L11.2 2.6z" />
      </svg>
    ),
    title: "Strava Integration",
    description:
      "Connect your Strava account to auto-verify activities, view route maps, and track your stats.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "Club Management",
    description:
      "Create your club, manage members, send invites, and run all your events from one dashboard.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
    title: "Activity Feed",
    description:
      "See what your crew is up to — bookings, check-ins, badges earned, and more in a social feed.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            Everything Your Club Needs
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From booking to badges, EventTara handles the logistics so you can focus on the
            adventure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-lime-500/30 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 mb-4 group-hover:bg-lime-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
