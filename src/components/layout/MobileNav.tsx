"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarIcon,
  DashboardIcon,
  ExploreIcon,
  HomeIcon,
  LoginIcon,
  ProfileIcon,
} from "@/components/icons";
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
