"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, CogIcon, DashboardIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/dashboard/events", label: "Events", icon: CalendarIcon },
  { href: "/dashboard/settings", label: "Settings", icon: CogIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
                isActive
                  ? "bg-lime-50 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
