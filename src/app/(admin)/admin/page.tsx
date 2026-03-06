import Link from "next/link";

const cards = [
  {
    title: "Feature Flags",
    description: "Toggle feature flags to enable or disable site features.",
    href: "/admin/feature-flags",
    count: "4 flags",
  },
  {
    title: "Hero Banners",
    description: "Manage hero carousel slides on the homepage.",
    href: "/admin/hero",
    count: "Slides",
  },
  {
    title: "Section Ordering",
    description: "Reorder and toggle homepage sections.",
    href: "/admin/sections",
    count: "11 sections",
  },
  {
    title: "Organizers",
    description: "Create organizer profiles and manage claim links.",
    href: "/admin/organizers",
    count: "Profiles",
  },
];

export default function AdminOverview() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
        Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                {card.title}
              </h3>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {card.count}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
