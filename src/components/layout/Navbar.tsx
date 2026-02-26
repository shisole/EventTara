"use client";

import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ChevronDownIcon, MenuIcon } from "@/components/icons";
import ExploreDropdown from "@/components/layout/ExploreDropdown";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { UserAvatar, Button } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";

const BorderPickerModal = dynamic(() => import("@/components/profile/BorderPickerModal"));

interface Activity {
  slug: string;
  label: string;
  icon: string;
  image: string;
}

interface ActiveBorderData {
  id: string | null;
  tier: BorderTier | null;
  color: string | null;
}

interface NavbarProps {
  user: User | null;
  role: string | null;
  loading: boolean;
  activities: Activity[];
  navLayout: string;
  activeBorder?: ActiveBorderData | null;
  onLogout: () => void;
  onMenuOpen: () => void;
  onBorderChange?: (borderId: string | null, tier: BorderTier | null, color: string | null) => void;
}

export default function Navbar({
  user,
  role,
  loading,
  activities,
  navLayout,
  activeBorder,
  onLogout,
  onMenuOpen,
  onBorderChange,
}: NavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [borderPickerOpen, setBorderPickerOpen] = useState(false);

  // Close dropdowns on route change
  useEffect(() => {
    setProfileOpen(false);
    setExploreOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!profileOpen && !exploreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (profileOpen && !e.target.closest("[data-profile-dropdown]")) {
        setProfileOpen(false);
      }
      if (exploreOpen && !e.target.closest("[data-explore-dropdown]")) {
        setExploreOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [profileOpen, exploreOpen]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon-192x192.png"
              alt="EventTara"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-2xl font-heading font-bold text-lime-500">EventTara</span>
            <span className="bg-lime-500 text-gray-900 text-xs px-2 py-0.5 rounded-full font-medium">
              BETA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative" data-explore-dropdown>
              <button
                onClick={() => {
                  setExploreOpen(!exploreOpen);
                }}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Explore Events
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
                />
              </button>
              {exploreOpen && (
                <Suspense fallback={null}>
                  <ExploreDropdown activities={activities} navLayout={navLayout} />
                </Suspense>
              )}
            </div>
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="relative" data-profile-dropdown>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                    }}
                    className="flex items-center gap-1 rounded-full hover:ring-2 hover:ring-lime-200 dark:hover:ring-lime-800 transition-all"
                  >
                    <UserAvatar
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.full_name || "User"}
                      size="sm"
                      borderTier={activeBorder?.tier ?? null}
                      borderColor={activeBorder?.color ?? null}
                    />
                    <ChevronDownIcon
                      className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.user_metadata?.full_name || "Adventurer"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {role === "organizer" && (
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/my-events"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        My Events
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setBorderPickerOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Change Border
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link href="/signup?role=organizer">
                  <Button variant="ghost" size="sm">
                    Host Your Event
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={onMenuOpen}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {user && (
        <BorderPickerModal
          open={borderPickerOpen}
          onClose={() => setBorderPickerOpen(false)}
          avatarUrl={user.user_metadata?.avatar_url ?? null}
          fullName={user.user_metadata?.full_name || "User"}
          activeBorderId={activeBorder?.id ?? null}
          onBorderChange={(borderId, tier, color) => {
            onBorderChange?.(borderId, tier, color);
          }}
        />
      )}
    </nav>
  );
}
