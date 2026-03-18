"use client";

import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ChevronDownIcon, MenuIcon } from "@/components/icons";
import ExploreDropdown from "@/components/layout/ExploreDropdown";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { NavLink } from "@/components/navigation/NavigationContext";
import { CompositeAvatar, Button } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/client";

const BorderPickerModal = dynamic(() => import("@/components/profile/BorderPickerModal"));
const NotificationBell = dynamic(() => import("@/components/notifications/NotificationBell"));

interface Activity {
  slug: string;
  label: string;
  icon: string;
  image: string | null;
}

interface ActiveBorderData {
  id: string | null;
  tier: BorderTier | null;
  color: string | null;
}

interface NavbarProps {
  user: User | null;
  canManage?: boolean;
  loading: boolean;
  activities: Activity[];
  navLayout: string;
  activeBorder?: ActiveBorderData | null;
  activityFeedEnabled?: boolean;
  avatarShopEnabled?: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
  onMenuOpen: () => void;
  onBorderChange?: (borderId: string | null, tier: BorderTier | null, color: string | null) => void;
}

export default function Navbar({
  user,
  canManage = false,
  loading,
  activities,
  navLayout,
  activeBorder,
  activityFeedEnabled = false,
  avatarShopEnabled = false,
  isAdmin = false,
  onLogout,
  onMenuOpen,
  onBorderChange,
}: NavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [borderPickerOpen, setBorderPickerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<{
    animalImageUrl: string | null;
    accessoryImageUrl: string | null;
    backgroundImageUrl: string | null;
    borderImageUrl: string | null;
    skinImageUrl: string | null;
  } | null>(null);

  // Fetch TaraTokens balance + avatar config
  useEffect(() => {
    if (!user || !avatarShopEnabled) return;
    const supabase = createClient();
    supabase
      .from("tara_tokens")
      .select("balance")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setTokenBalance(data?.balance ?? 0);
      });
    fetch("/api/users/avatar-config")
      .then((r) => r.json())
      .then(
        (data: {
          animal_image_url?: string | null;
          accessory_image_url?: string | null;
          background_image_url?: string | null;
          border_image_url?: string | null;
          skin_image_url?: string | null;
        }) => {
          if (data.animal_image_url) {
            setAvatarConfig({
              animalImageUrl: data.animal_image_url,
              accessoryImageUrl: data.accessory_image_url ?? null,
              backgroundImageUrl: data.background_image_url ?? null,
              borderImageUrl: data.border_image_url ?? null,
              skinImageUrl: data.skin_image_url ?? null,
            });
          }
        },
      )
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, [user, avatarShopEnabled]);

  // Track scroll position for transparent → frosted transition
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll(); // Check initial position
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // When on homepage with dark hero visible behind transparent nav
  const heroVisible = pathname === "/" && !scrolled;

  return (
    <div className="fixed top-0 md:top-3 left-0 right-0 z-50 md:px-4 md:pointer-events-none">
      <nav
        className={`md:pointer-events-auto md:w-fit md:mx-auto md:rounded-2xl transition-all duration-300 ${
          scrolled
            ? "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:bg-white/90 md:dark:bg-gray-900/90 md:backdrop-blur-md md:border md:border-gray-200/80 md:dark:border-gray-700/80 md:shadow-lg md:shadow-black/5 md:dark:shadow-black/20"
            : "bg-transparent border-b border-transparent md:bg-white/5 md:backdrop-blur-sm md:border md:border-white/10"
        }`}
      >
        <div className="flex items-center justify-between md:justify-center md:gap-6 h-14 md:h-12 px-4 sm:px-6">
          <NavLink href="/" className="flex items-center gap-2">
            <Image
              src="/favicon-48x48.png"
              alt="EventTara"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span
              className="text-lg sm:text-2xl md:text-3xl font-cursive font-bold text-lime-600 dark:text-lime-500"
              style={{ WebkitTextStroke: "0.5px currentColor" }}
            >
              EventTara
            </span>
            <span className="bg-lime-500 text-gray-900 text-xs px-2 py-0.5 rounded-full font-medium">
              BETA
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <div
              className="relative pb-2 -mb-2"
              data-explore-dropdown
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button
                onClick={() => {
                  setExploreOpen(!exploreOpen);
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium transition-colors ${
                  heroVisible
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
                }`}
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
            <NavLink
              href="/clubs"
              className={`font-medium transition-colors ${
                pathname === "/clubs" || pathname.startsWith("/clubs/")
                  ? "text-lime-600 dark:text-lime-400"
                  : heroVisible
                    ? "text-white/90 hover:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Clubs
            </NavLink>
            {activityFeedEnabled && (
              <NavLink
                href="/feed"
                className={`font-medium transition-colors ${
                  pathname === "/feed"
                    ? "text-lime-600 dark:text-lime-400"
                    : heroVisible
                      ? "text-white/90 hover:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Feed
              </NavLink>
            )}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {avatarShopEnabled && tokenBalance !== null && (
                  <NavLink
                    href="/shop"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    title="TaraTokens"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="8" r="7" fill="#F59E0B" />
                      <text
                        x="8"
                        y="11"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="white"
                      >
                        T
                      </text>
                    </svg>
                    {tokenBalance.toLocaleString()}
                  </NavLink>
                )}
                <NotificationBell userId={user.id} />
                <div className="relative" data-profile-dropdown>
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                    }}
                    className="flex items-center gap-1 rounded-full hover:ring-2 hover:ring-lime-200 dark:hover:ring-lime-800 transition-all"
                  >
                    <CompositeAvatar
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.full_name || "User"}
                      size="sm"
                      borderTier={activeBorder?.tier ?? null}
                      borderColor={activeBorder?.color ?? null}
                      avatarConfig={avatarConfig}
                    />
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${profileOpen ? "rotate-180" : ""} ${heroVisible ? "text-white/70" : "text-gray-400"}`}
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
                      {isAdmin && (
                        <NavLink
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Admin Panel
                        </NavLink>
                      )}
                      {canManage && (
                        <NavLink
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Dashboard
                        </NavLink>
                      )}
                      <NavLink
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Profile
                      </NavLink>
                      <NavLink
                        href="/my-events"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        My Events
                      </NavLink>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setBorderPickerOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Change Border
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>Theme</span>
                        <ThemeToggle />
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
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
                <NavLink href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </NavLink>
                <NavLink href="/signup">
                  <Button size="sm">Sign Up</Button>
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile: coin + bell + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {user && avatarShopEnabled && tokenBalance !== null && (
              <NavLink
                href="/shop"
                className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium text-amber-600 dark:text-amber-400"
                title="TaraTokens"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="7" fill="#F59E0B" />
                  <text
                    x="8"
                    y="11"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="white"
                  >
                    T
                  </text>
                </svg>
                {tokenBalance.toLocaleString()}
              </NavLink>
            )}
            {user && <NotificationBell userId={user.id} />}
            <button
              onClick={onMenuOpen}
              className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
                heroVisible
                  ? "text-white/90 hover:bg-white/10"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

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
    </div>
  );
}
