"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, CogIcon, DashboardIcon, LinkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ClubDashboardSidebarProps {
  clubSlug: string;
  clubName: string;
  clubLogoUrl: string | null;
  userRole: string;
}

export default function ClubDashboardSidebar({
  clubSlug,
  clubName,
  clubLogoUrl,
  userRole,
}: ClubDashboardSidebarProps) {
  const pathname = usePathname();
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

  const publicClubUrl = `/clubs/${clubSlug}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/30 p-4">
      {/* Club header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          &larr;
        </Link>
        {clubLogoUrl ? (
          <Image
            src={clubLogoUrl}
            alt={clubName}
            width={32}
            height={32}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
            <span className="text-sm font-bold text-lime-600 dark:text-lime-400">
              {clubName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-sm dark:text-white truncate">{clubName}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-1 md:flex-col md:gap-0 md:space-y-1">
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
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[36px]",
                isActive
                  ? "bg-lime-50 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Public links */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1 md:flex-col md:gap-0 md:space-y-1">
        <Link
          href={`${publicClubUrl}/forum`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[36px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          href={publicClubUrl}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[36px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}
