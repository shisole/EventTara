"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarIcon,
  ChevronLeftIcon,
  CogIcon,
  DashboardIcon,
  LinkIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

export default function ClubDashboardMobileNav() {
  const pathname = usePathname();

  // Extract club slug from pathname
  const clubPattern = /\/dashboard\/clubs\/([^/]+)/;
  const match = clubPattern.exec(pathname);
  const clubSlug = match?.[1];

  // Only render on club dashboard pages
  if (!clubSlug) return null;

  const base = `/dashboard/clubs/${clubSlug}`;

  const navItems = [
    { href: base, label: "Overview", icon: DashboardIcon, exact: true },
    { href: `${base}/events`, label: "Events", icon: CalendarIcon },
    {
      href: `${base}/members`,
      label: "Members",
      icon: (props: { className?: string }) => (
        <svg className={props.className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    { href: `${base}/invites`, label: "Invites", icon: LinkIcon },
    { href: `${base}/settings`, label: "Settings", icon: CogIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-stretch">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Back to dashboard"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="text-[10px]">Back</span>
        </Link>

        {/* Divider */}
        <div className="w-px bg-gray-200 dark:bg-gray-800 my-2" />

        {/* Nav items */}
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive
                  ? "text-lime-600 dark:text-lime-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
