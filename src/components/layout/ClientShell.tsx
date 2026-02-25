"use client";

import type { User } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import MobileDrawer from "@/components/layout/MobileDrawer";
import { createClient } from "@/lib/supabase/client";

const Navbar = dynamic(() => import("@/components/layout/Navbar"), {
  loading: () => (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span className="text-2xl font-heading font-bold text-lime-500">EventTara</span>
        </div>
      </div>
    </nav>
  ),
});
const MobileNav = dynamic(() => import("@/components/layout/MobileNav"), {
  loading: () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 h-16 safe-area-bottom" />
  ),
});

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

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navLayout, setNavLayout] = useState<string>("strip");
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const fetchRole = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from("users").select("role").eq("id", userId).single();
      setRole(data?.role ?? null);
    },
    [supabase],
  );

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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

  // Fetch nav layout from Payload site-settings
  useEffect(() => {
    const fetchNavLayout = async () => {
      try {
        const res = await fetch("/api/globals/site-settings");
        if (res.ok) {
          const data: { navLayout?: string } = await res.json();
          if (data.navLayout) setNavLayout(data.navLayout);
        }
      } catch {
        // Payload unavailable — keep default "strip"
      }
    };
    void fetchNavLayout();
  }, []);

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
        <Navbar
          user={user}
          role={role}
          loading={loading}
          activities={activities}
          navLayout={navLayout}
          onLogout={() => void handleLogout()}
          onMenuOpen={handleMenuOpen}
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
    </>
  );
}
