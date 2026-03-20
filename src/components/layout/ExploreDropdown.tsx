"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import ActivityCard from "@/components/layout/ActivityCard";
import { NavLink } from "@/components/navigation/NavigationContext";

interface Activity {
  slug: string;
  label: string;
  icon: string;
  image: string | null;
}

interface LayoutProps {
  activities: Activity[];
}

interface ExploreDropdownProps extends LayoutProps {
  navLayout: string;
}

const ALL_EVENTS_IMAGE = "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80";

function AllEventsCard({ className }: { className?: string }) {
  return (
    <NavLink
      href="/events"
      className={`group relative overflow-hidden rounded-xl block ${className ?? ""}`}
    >
      <Image
        src={ALL_EVENTS_IMAGE}
        alt="All Events"
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/20" />
      <div className="relative z-10 flex items-center gap-2 p-3">
        <span className="text-lg">🌟</span>
        <span className="text-white font-semibold text-sm drop-shadow-md">All Events</span>
      </div>
    </NavLink>
  );
}

function StripLayout({ activities }: LayoutProps) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[880px] bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-4 z-50">
      <div className="flex gap-3">
        <AllEventsCard className="flex-1 aspect-[3/4]" />
        {activities.map((activity) => (
          <ActivityCard key={activity.slug} {...activity} className="flex-1 aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}

function GridLayout({ activities }: LayoutProps) {
  return (
    <div className="absolute left-0 mt-2 w-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-4 z-50">
      <div className="grid grid-cols-2 gap-3">
        <AllEventsCard className="aspect-[4/3]" />
        {activities.map((activity) => (
          <ActivityCard key={activity.slug} {...activity} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

function ListLayout({ activities }: LayoutProps) {
  return (
    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-2 z-50">
      <AllEventsCard className="h-12 mb-1" />
      {activities.map((activity) => (
        <ActivityCard key={activity.slug} {...activity} className="my-1 h-12" />
      ))}
    </div>
  );
}

export default function ExploreDropdown({ activities, navLayout }: ExploreDropdownProps) {
  const searchParams = useSearchParams();
  // ?nav= query param overrides the Payload setting
  const layout = searchParams.get("nav") ?? navLayout;

  switch (layout) {
    case "strip": {
      return <StripLayout activities={activities} />;
    }
    case "grid": {
      return <GridLayout activities={activities} />;
    }
    default: {
      return <ListLayout activities={activities} />;
    }
  }
}
