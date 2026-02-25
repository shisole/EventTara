"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarIcon,
  CogIcon,
  DashboardIcon,
  ExploreIcon,
  HomeIcon,
  LocationPinIcon,
  LoginIcon,
  ProfileIcon,
} from "@/components/icons";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  user: User | null;
  role: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; variant?: "outline" | "filled" }>;
  isActive: (pathname: string) => boolean;
}

function getNavItems(user: User | null, role: string | null, pathname: string): NavItem[] {
  // Dashboard-specific nav items when on /dashboard
  if (user && role === "organizer" && pathname.startsWith("/dashboard")) {
    return [
      {
        href: "/dashboard",
        label: "Overview",
        icon: DashboardIcon,
        isActive: (p) => p === "/dashboard",
      },
      {
        href: "/dashboard/events",
        label: "Events",
        icon: CalendarIcon,
        isActive: (p) => p.startsWith("/dashboard/events"),
      },
      {
        href: "/dashboard/guides",
        label: "Guides",
        icon: LocationPinIcon,
        isActive: (p) => p.startsWith("/dashboard/guides"),
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: CogIcon,
        isActive: (p) => p.startsWith("/dashboard/settings"),
      },
    ];
  }

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
      isActive: (p) =>
        p === "/profile" || p.startsWith("/profile/") || p.startsWith("/organizers/"),
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
  const { keyboardHeight } = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;

  // Hide on auth pages
  if (
    ["/login", "/signup", "/guest-setup", "/forgot-password", "/reset-password"].includes(pathname)
  )
    return null;

  const navItems = getNavItems(user, role, pathname);

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-bottom transition-all duration-200",
        keyboardOpen && "translate-y-full opacity-0 pointer-events-none",
      )}
    >
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
              <Icon className="w-6 h-6" variant={active ? "filled" : "outline"} />
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
