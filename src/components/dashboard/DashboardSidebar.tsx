"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, CogIcon, DashboardIcon, LinkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import ClubSwitcher from "./ClubSwitcher";

interface ClubOption {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
}

interface DashboardSidebarProps {
  clubs?: ClubOption[];
}

const GENERAL_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon, exact: true },
];

export default function DashboardSidebar({ clubs = [] }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Check if we're on a club-specific page
  const clubPattern = /\/dashboard\/clubs\/([^/]+)/;
  const clubSlugMatch = clubPattern.exec(pathname);
  const currentClubSlug = clubSlugMatch?.[1];
  const isClubPage = !!currentClubSlug;

  // Build club-specific nav items when on a club page
  const clubNavItems = currentClubSlug
    ? [
        {
          href: `/dashboard/clubs/${currentClubSlug}`,
          label: "Overview",
          icon: DashboardIcon,
          exact: true,
        },
        {
          href: `/dashboard/clubs/${currentClubSlug}/events`,
          label: "Events",
          icon: CalendarIcon,
        },
        {
          href: `/dashboard/clubs/${currentClubSlug}/members`,
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
        {
          href: `/dashboard/clubs/${currentClubSlug}/invites`,
          label: "Invites",
          icon: LinkIcon,
        },
        {
          href: `/dashboard/clubs/${currentClubSlug}/settings`,
          label: "Settings",
          icon: CogIcon,
        },
      ]
    : [];

  const navItems = isClubPage ? clubNavItems : GENERAL_NAV_ITEMS;

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-[calc(100dvh-4rem)] p-4 hidden md:block">
      {clubs.length > 0 && (
        <div className="mb-4">
          <ClubSwitcher clubs={clubs} />
        </div>
      )}

      <nav className="space-y-1">
        {isClubPage && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            &larr; All Clubs
          </Link>
        )}

        {navItems.map((item) => {
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
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

        {isClubPage && currentClubSlug && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
            <Link
              href={`/clubs/${currentClubSlug}/forum`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <span>Forum</span>
            </Link>
            <Link
              href={`/clubs/${currentClubSlug}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>View Club Page</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}
