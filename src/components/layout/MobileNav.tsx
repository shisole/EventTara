"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: User | null;
  role: string | null;
}

// Each icon pair: [outline, filled]
function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28h-1.44v7.44a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-7.44H2.31a.75.75 0 01-.53-1.28l8.69-8.69z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function ExploreIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM15.61 8.39l-2.554 5.107a1.5 1.5 0 01-.67.67L7.28 16.72a.75.75 0 01-1-.999l2.554-5.108a1.5 1.5 0 01.67-.67l5.107-2.553a.75.75 0 01.999.999z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zM13.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zm.75-3a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5zm3-6a.75.75 0 100-1.5.75.75 0 000 1.5zm.75 1.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM6.75 3v.75h10.5V3a.75.75 0 011.5 0v.75h.75c1.24 0 2.25 1.01 2.25 2.25v13.5c0 1.24-1.01 2.25-2.25 2.25H4.5c-1.24 0-2.25-1.01-2.25-2.25V6c0-1.24 1.01-2.25 2.25-2.25h.75V3a.75.75 0 011.5 0zm13.5 6.75H3.75v9.75c0 .414.336.75.75.75h15c.414 0 .75-.336.75-.75V9.75z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function LoginIcon({ active }: { active: boolean }) {
  return active ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M16.5 3.75a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5h-6a1.5 1.5 0 01-1.5-1.5V15a.75.75 0 00-1.5 0v3.75a3 3 0 003 3h6a3 3 0 003-3V5.25a3 3 0 00-3-3h-6a3 3 0 00-3 3V9A.75.75 0 009 9V5.25a1.5 1.5 0 011.5-1.5h6zm-5.03 4.72a.75.75 0 000 1.06l1.72 1.72H2.25a.75.75 0 000 1.5h10.94l-1.72 1.72a.75.75 0 101.06 1.06l3-3a.75.75 0 000-1.06l-3-3a.75.75 0 00-1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ active: boolean }>;
  isActive: (pathname: string) => boolean;
}

function getNavItems(user: User | null, role: string | null): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: HomeIcon,
      isActive: (p) => p === "/",
    },
    {
      href: "/events",
      label: "Explore",
      icon: ExploreIcon,
      isActive: (p) => p === "/events" || (p.startsWith("/events/") && !p.includes("/book")),
    },
  ];

  if (user) {
    if (role === "organizer") {
      items.push({
        href: "/dashboard",
        label: "Dashboard",
        icon: DashboardIcon,
        isActive: (p) => p.startsWith("/dashboard"),
      });
    } else {
      items.push({
        href: "/my-events",
        label: "My Events",
        icon: CalendarIcon,
        isActive: (p) => p === "/my-events",
      });
    }

    items.push({
      href: "/profile",
      label: "Profile",
      icon: ProfileIcon,
      isActive: (p) => p === "/profile" || p.startsWith("/profile/"),
    });
  } else {
    items.push({
      href: "/login",
      label: "Sign In",
      icon: LoginIcon,
      isActive: (p) => p === "/login" || p === "/signup",
    });
  }

  return items;
}

export default function MobileNav({ user, role }: MobileNavProps) {
  const pathname = usePathname();

  // Hide on dashboard pages (organizer has its own sidebar)
  if (pathname.startsWith("/dashboard")) return null;

  // Hide on auth pages
  if (
    ["/login", "/signup", "/guest-setup", "/forgot-password", "/reset-password"].includes(pathname)
  )
    return null;

  const navItems = getNavItems(user, role);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] rounded-xl transition-colors active:scale-95 active:bg-gray-100 dark:active:bg-gray-800",
                active ? "text-lime-600 dark:text-lime-400" : "text-gray-400 dark:text-gray-500",
              )}
            >
              <Icon active={active} />
              <span className={cn("text-[11px]", active ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
