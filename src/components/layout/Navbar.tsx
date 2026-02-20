"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Avatar } from "@/components/ui";
import ThemeToggle from "@/components/layout/ThemeToggle";
import type { User } from "@supabase/supabase-js";

const activities = [
  { slug: "hiking", label: "Hiking", icon: "🏔️" },
  { slug: "mtb", label: "Mountain Biking", icon: "🚵" },
  { slug: "road_bike", label: "Road Biking", icon: "🚴" },
  { slug: "running", label: "Running", icon: "🏃" },
  { slug: "trail_run", label: "Trail Running", icon: "🥾" },
];

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    setRole(data?.role ?? null);
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchRole(user.id);
      setLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setExploreOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!profileOpen && !exploreOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (profileOpen && !target.closest("[data-profile-dropdown]")) {
        setProfileOpen(false);
      }
      if (exploreOpen && !target.closest("[data-explore-dropdown]")) {
        setExploreOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [profileOpen, exploreOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
            <span className="text-2xl font-heading font-bold text-lime-500">
              EventTara
            </span>
            <span className="bg-lime-500 text-gray-900 text-xs px-2 py-0.5 rounded-full font-medium">
              BETA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative" data-explore-dropdown>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Explore Events
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {exploreOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 py-2 z-50">
                  <Link
                    href="/events"
                    className="block px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    All Events
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  {activities.map((activity) => (
                    <Link
                      key={activity.slug}
                      href={`/events?type=${activity.slug}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span>{activity.icon}</span>
                      {activity.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="relative" data-profile-dropdown>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1 rounded-full hover:ring-2 hover:ring-lime-200 dark:hover:ring-lime-800 transition-all"
                  >
                    <Avatar
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.full_name || "User"}
                      size="sm"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.user_metadata?.full_name || "Adventurer"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
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
                        onClick={handleLogout}
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
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-4 space-y-2">
            <div>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium min-h-[44px] flex items-center justify-between"
              >
                Explore Events
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform ${exploreOpen ? "rotate-180" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {exploreOpen && (
                <div className="ml-4 space-y-1">
                  <Link
                    href="/events"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] flex items-center"
                  >
                    All Events
                  </Link>
                  {activities.map((activity) => (
                    <Link
                      key={activity.slug}
                      href={`/events?type=${activity.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] flex items-center gap-2"
                    >
                      <span>{activity.icon}</span>
                      {activity.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium min-h-[44px] flex items-center"
                >
                  Profile
                </Link>
                <Link
                  href="/my-events"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium min-h-[44px] flex items-center"
                >
                  My Events
                </Link>
                {role === "organizer" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium min-h-[44px] flex items-center"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium min-h-[44px] flex items-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full min-h-[44px]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full min-h-[44px]">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
