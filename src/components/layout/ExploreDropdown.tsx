"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ActivityCard from "@/components/layout/ActivityCard";

interface Activity {
  slug: string;
  label: string;
  icon: string;
  image: string;
}

interface LayoutProps {
  activities: Activity[];
}

interface ExploreDropdownProps extends LayoutProps {
  navLayout: string;
}

function AllEventsLink({ className }: { className?: string }) {
  return (
    <Link href="/events" className={className}>
      All Events
    </Link>
  );
}

function StripLayout({ activities }: LayoutProps) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[780px] bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-4 z-50">
      <AllEventsLink className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-lime-500 mb-3" />
      <div className="flex gap-3">
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
      <AllEventsLink className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-lime-500 mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.slug} {...activity} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

function ListLayout({ activities }: LayoutProps) {
  return (
    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 py-2 z-50">
      <AllEventsLink className="block px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700" />
      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
      {activities.map((activity) => (
        <ActivityCard key={activity.slug} {...activity} className="mx-2 my-1 h-12" />
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
