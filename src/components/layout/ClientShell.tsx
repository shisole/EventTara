"use client";

import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DebugFlagProvider } from "@/components/debug/DebugFlagContext";
import MobileNav from "@/components/layout/MobileNav";
import Navbar from "@/components/layout/Navbar";
import { NavigationProvider } from "@/components/navigation/NavigationContext";
import NavigationLoader from "@/components/navigation/NavigationLoader";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { type CmsFeatureFlags } from "@/lib/cms/types";
import { type BorderTier } from "@/lib/constants/avatar-borders";
import { BreadcrumbProvider } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/client";

const DebugToolPanel = dynamic(() => import("@/components/debug/DebugToolPanel"), { ssr: false });
const DemoBanner = dynamic(() => import("@/components/layout/DemoBanner"));
const MobileDrawer = dynamic(() => import("@/components/layout/MobileDrawer"));
const ChatBubble = dynamic(() => import("@/components/chat/ChatBubble"), { ssr: false });
const InstallPrompt = dynamic(() => import("@/components/pwa/InstallPrompt"));

const DEFAULT_ACTIVITIES = [
  {
    slug: "hiking",
    label: "Hiking",
    icon: "🏔️",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
  },
  {
    slug: "mtb",
    label: "Mountain Biking",
    icon: "🚵",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&h=400&fit=crop",
  },
  {
    slug: "road_bike",
    label: "Road Biking",
    icon: "🚴",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
  },
  {
    slug: "running",
    label: "Running",
    icon: "🏃",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop",
  },
  {
    slug: "trail_run",
    label: "Trail Running",
    icon: "🥾",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=400&fit=crop",
  },
];

interface ActivityItem {
  slug: string;
  label: string;
  icon: string;
  image: string | null;
}

interface ClientShellProps {
  children: React.ReactNode;
  initialNavLayout?: string;
  activityFeedEnabled?: boolean;
  adminUserIds?: string[];
  featureFlags?: CmsFeatureFlags | null;
  siteSettings?: { site_name?: string; tagline?: string; nav_layout?: string } | null;
  heroSlideCount?: number;
  activityTypes?: ActivityItem[];
  initialUser?: User | null;
  initialRole?: string | null;
  initialCanManage?: boolean;
  initialActiveBorder?: { id: string; tier: BorderTier; color: string | null } | null;
}

export default function ClientShell({
  children,
  initialNavLayout = "strip",
  activityFeedEnabled = false,
  adminUserIds = [],
  featureFlags = null,
  siteSettings = null,
  heroSlideCount = 0,
  activityTypes,
  initialUser = null,
  initialRole = null,
  initialCanManage = false,
  initialActiveBorder = null,
}: ClientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLighthouse = useMemo(
    () =>
      typeof globalThis !== "undefined" &&
      globalThis.location !== undefined &&
      new URLSearchParams(globalThis.location.search).has("lighthouse"),
    [],
  );
  const isDebugMode = useMemo(
    () =>
      typeof globalThis !== "undefined" &&
      globalThis.location !== undefined &&
      new URLSearchParams(globalThis.location.search).has("debug_tool"),
    [],
  );
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<string | null>(initialRole);
  const [canManage, setCanManage] = useState(initialCanManage);
  const [activeBorder, setActiveBorder] = useState<{
    id: string | null;
    tier: BorderTier | null;
    color: string | null;
  } | null>(initialActiveBorder);
  const [loading, setLoading] = useState(false);
  const hadInitialUser = useRef(!!initialUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navLayout] = useState<string>(initialNavLayout);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isAdmin = !!user && adminUserIds.includes(user.id);
  const showDebugPanel = isDebugMode && isAdmin && !loading;

  const fetchRole = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("role, active_border_id")
        .eq("id", userId)
        .single();

      setRole(data?.role ?? null);

      // Check if user has management role in any club
      const { data: managementMemberships } = await supabase
        .from("club_members")
        .select("id")
        .eq("user_id", userId)
        .in("role", ["owner", "admin", "moderator"])
        .limit(1);

      setCanManage(managementMemberships !== null && managementMemberships.length > 0);

      if (data?.active_border_id) {
        const { data: borderData } = await supabase
          .from("avatar_borders")
          .select("tier, border_color")
          .eq("id", data.active_border_id)
          .single();

        if (borderData) {
          setActiveBorder({
            id: data.active_border_id,
            tier: borderData.tier,
            color: borderData.border_color,
          });
        } else {
          setActiveBorder(null);
        }
      } else {
        setActiveBorder(null);
      }
    },
    [supabase],
  );

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Listen for border changes from other components (e.g. ProfileHeader)
  useEffect(() => {
    const handleBorderChange = (e: Event) => {
      const detail: { borderId: string | null; tier: BorderTier | null; color: string | null } =
        (e instanceof CustomEvent && e.detail) || { borderId: null, tier: null, color: null };
      setActiveBorder(
        detail.borderId ? { id: detail.borderId, tier: detail.tier, color: detail.color } : null,
      );
    };
    globalThis.addEventListener("border-change", handleBorderChange);
    return () => globalThis.removeEventListener("border-change", handleBorderChange);
  }, []);

  // Auth state
  useEffect(() => {
    // Skip initial fetch if server already provided auth data
    if (!hadInitialUser.current) {
      const getUser = async () => {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) await fetchRole(currentUser.id);
        setLoading(false);
      };
      void getUser();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchRole(session.user.id);
      } else {
        setRole(null);
        setCanManage(false);
        setActiveBorder(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchRole]);

  // Redirect existing users to avatar picker if they haven't picked one yet
  const avatarShopEnabled = featureFlags?.avatar_shop_enabled === true;
  useEffect(() => {
    if (!avatarShopEnabled || !user || loading) return;
    // Don't redirect if already on setup pages
    const skipPaths = ["/setup-avatar", "/setup-username", "/login", "/signup", "/guest-setup"];
    if (skipPaths.some((p) => pathname.startsWith(p))) return;

    supabase
      .from("users")
      .select("has_picked_avatar")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.has_picked_avatar) {
          router.push(`/setup-avatar?next=${encodeURIComponent(pathname)}`);
        }
      });
  }, [avatarShopEnabled, user, loading, pathname, supabase, router]);

  // Edge swipe detection (right 20px edge, swipe left to open)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      const startedFromEdge = touchStartX.current > window.innerWidth - 20;
      if (startedFromEdge && deltaX < -80 && deltaY < 100) {
        setDrawerOpen(true);
      }
    };

    const mql = globalThis.matchMedia("(max-width: 767px)");
    if (mql.matches) {
      document.addEventListener("touchstart", handleTouchStart, { passive: true });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchend", handleTouchEnd, { passive: true });
      } else {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
        setDrawerOpen(false);
      }
    };
    mql.addEventListener("change", onChange);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      mql.removeEventListener("change", onChange);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    globalThis.location.href = "/";
  }, [supabase]);

  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);
  const handleMenuOpen = useCallback(() => setDrawerOpen(true), []);

  return (
    <DebugFlagProvider active={showDebugPanel} serverFlags={featureFlags}>
      <NavigationProvider>
        <OfflineIndicator />
        <NavigationLoader />
        <div className={`min-h-dvh flex flex-col ${drawerOpen ? "pointer-events-none" : ""}`}>
          {!isLighthouse && process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <DemoBanner isLoggedIn={!loading && !!user && !user.is_anonymous} />
          )}
          <Navbar
            user={user}
            canManage={canManage}
            loading={loading}
            activities={activityTypes ?? DEFAULT_ACTIVITIES}
            navLayout={navLayout}
            activeBorder={activeBorder}
            activityFeedEnabled={activityFeedEnabled}
            avatarShopEnabled={featureFlags?.avatar_shop_enabled === true}
            isAdmin={isAdmin}
            onLogout={() => void handleLogout()}
            onMenuOpen={handleMenuOpen}
            onBorderChange={(borderId, tier, color) => {
              setActiveBorder(borderId ? { id: borderId, tier, color } : null);
            }}
          />
          <BreadcrumbProvider>
            <div className="flex-1 pt-14 md:pt-20 pb-16 md:pb-0">{children}</div>
          </BreadcrumbProvider>
          <MobileNav user={user} canManage={canManage} activityFeedEnabled={activityFeedEnabled} />
        </div>

        <MobileDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          activities={activityTypes ?? DEFAULT_ACTIVITIES}
          user={user}
          canManage={canManage}
          isAdmin={isAdmin}
          onLogout={() => void handleLogout()}
        />

        <ChatBubble />
        <InstallPrompt />
        {showDebugPanel && user && (
          <DebugToolPanel
            user={user}
            role={role}
            siteSettings={siteSettings}
            heroSlideCount={heroSlideCount}
          />
        )}
      </NavigationProvider>
    </DebugFlagProvider>
  );
}
