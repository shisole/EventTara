"use client";

import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import MobileNav from "@/components/layout/MobileNav";
import Navbar from "@/components/layout/Navbar";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/client";

const DemoBanner = dynamic(() => import("@/components/layout/DemoBanner"));
const RouteLoader = dynamic(() => import("@/components/layout/RouteLoader"));
const MobileDrawer = dynamic(() => import("@/components/layout/MobileDrawer"));
const ChatBubble = dynamic(() => import("@/components/chat/ChatBubble"), { ssr: false });

const activities = [
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

interface ClientShellProps {
  children: React.ReactNode;
  initialNavLayout?: string;
}

export default function ClientShell({ children, initialNavLayout = "strip" }: ClientShellProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activeBorder, setActiveBorder] = useState<{
    id: string | null;
    tier: BorderTier | null;
    color: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navLayout] = useState<string>(initialNavLayout);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const fetchRole = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("role, active_border_id")
        .eq("id", userId)
        .single();

      setRole(data?.role ?? null);

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
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) await fetchRole(currentUser.id);
      setLoading(false);
    };
    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchRole]);

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
    <>
      <div
        className={`transition-all duration-300 origin-top min-h-screen flex flex-col ${
          drawerOpen ? "scale-[0.95] opacity-50 rounded-xl overflow-hidden pointer-events-none" : ""
        }`}
      >
        {!loading && <DemoBanner isLoggedIn={!!user && !user.is_anonymous} />}
        <Navbar
          user={user}
          role={role}
          loading={loading}
          activities={activities}
          navLayout={navLayout}
          activeBorder={activeBorder}
          onLogout={() => void handleLogout()}
          onMenuOpen={handleMenuOpen}
          onBorderChange={(borderId, tier, color) => {
            setActiveBorder(borderId ? { id: borderId, tier, color } : null);
          }}
        />
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <MobileNav user={user} role={role} />
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        activities={activities}
        user={user}
        role={role}
        onLogout={() => void handleLogout()}
      />

      <ChatBubble />
      <RouteLoader />
    </>
  );
}
