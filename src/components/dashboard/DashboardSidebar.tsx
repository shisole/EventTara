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
      </nav>
    </aside>
  );
}
