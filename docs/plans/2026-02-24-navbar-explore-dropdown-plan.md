# Navbar Explore Dropdown Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the plain-text Explore Events dropdown with image-backed activity cards (3 layout variants via `?nav=` query param), and convert the mobile menu into a swipe-enabled side drawer with page scale-down effect.

**Architecture:** Extract the Explore dropdown and mobile drawer into separate components. The `activities` array gets Unsplash image URLs. Desktop reads `?nav=strip|grid|list` to pick layout. Mobile drawer uses touch events for swipe open/close, and wraps page content in a transform container for the scale-down effect.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS, next/image (Unsplash already configured), vanilla touch events.

---

### Task 1: Add Unsplash images to activities array

**Files:**

- Modify: `src/components/layout/Navbar.tsx:13-19`

**Step 1: Update the activities array with image URLs**

Add an `image` field to each activity with a curated Unsplash photo URL. Pick landscape-oriented photos that work well cropped to various aspect ratios.

```typescript
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
```

**Step 2: Verify images load**

Run: `npm run dev` — navigate to any page, open browser DevTools Network tab, confirm Unsplash URLs resolve without errors. Images won't be visible yet (no UI changes).

**Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: add Unsplash images to activities array"
```

---

### Task 2: Create ActivityCard component

**Files:**

- Create: `src/components/layout/ActivityCard.tsx`

**Step 1: Create the shared card component**

This card is used by all three desktop layouts and the mobile drawer. It renders a `next/image` background with a dark overlay that lightens on hover.

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface ActivityCardProps {
  slug: string;
  label: string;
  icon: string;
  image: string;
  className?: string;
}

export default function ActivityCard({ slug, label, icon, image, className }: ActivityCardProps) {
  return (
    <Link
      href={`/events?type=${slug}`}
      className={cn("group relative overflow-hidden rounded-xl block", className)}
    >
      <Image
        src={image}
        alt={label}
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Dark overlay — lightens on hover */}
      <div className="absolute inset-0 bg-black/60 transition-colors duration-300 group-hover:bg-black/20" />
      {/* Label */}
      <div className="relative z-10 flex items-center gap-2 p-3">
        <span className="text-lg">{icon}</span>
        <span className="text-white font-semibold text-sm drop-shadow-md">{label}</span>
      </div>
    </Link>
  );
}
```

**Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: no errors related to ActivityCard.

**Step 3: Commit**

```bash
git add src/components/layout/ActivityCard.tsx
git commit -m "feat: add ActivityCard component with image overlay"
```

---

### Task 3: Create ExploreDropdown component with 3 layout variants

**Files:**

- Create: `src/components/layout/ExploreDropdown.tsx`

**Step 1: Create the dropdown component**

Reads `?nav=strip|grid|list` from `useSearchParams()`. Renders the appropriate layout.

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ActivityCard from "@/components/layout/ActivityCard";

type Activity = {
  slug: string;
  label: string;
  icon: string;
  image: string;
};

interface ExploreDropdownProps {
  activities: Activity[];
}

function AllEventsLink({ className }: { className?: string }) {
  return (
    <Link href="/events" className={className}>
      All Events
    </Link>
  );
}

function StripLayout({ activities }: ExploreDropdownProps) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[780px] bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-4 z-50">
      <AllEventsLink className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-lime-500 mb-3" />
      <div className="flex gap-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.slug} {...activity} className="flex-1 aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}

function GridLayout({ activities }: ExploreDropdownProps) {
  return (
    <div className="absolute left-0 mt-2 w-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 p-4 z-50">
      <AllEventsLink className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-lime-500 mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.slug} {...activity} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

function ListLayout({ activities }: ExploreDropdownProps) {
  return (
    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 py-2 z-50">
      <AllEventsLink className="block px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700" />
      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
      {activities.map((activity) => (
        <ActivityCard key={activity.slug} {...activity} className="mx-2 my-1 h-12" />
      ))}
    </div>
  );
}

export default function ExploreDropdown({ activities }: ExploreDropdownProps) {
  const searchParams = useSearchParams();
  const navLayout = searchParams.get("nav") ?? "list";

  switch (navLayout) {
    case "strip":
      return <StripLayout activities={activities} />;
    case "grid":
      return <GridLayout activities={activities} />;
    default:
      return <ListLayout activities={activities} />;
  }
}
```

**Step 2: Verify it compiles**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/components/layout/ExploreDropdown.tsx
git commit -m "feat: add ExploreDropdown with strip/grid/list variants"
```

---

### Task 4: Integrate ExploreDropdown into Navbar

**Files:**

- Modify: `src/components/layout/Navbar.tsx:1-157`

**Step 1: Replace the desktop dropdown**

Add import for `ExploreDropdown` and `Suspense` (needed because `useSearchParams` requires a Suspense boundary).

Replace lines 136-155 (the old `{exploreOpen && (<div className="absolute ...">...)}`) with:

```tsx
{
  exploreOpen && (
    <Suspense fallback={null}>
      <ExploreDropdown activities={activities} />
    </Suspense>
  );
}
```

Remove the old inline dropdown JSX entirely.

**Step 2: Verify in browser**

Run: `npm run dev` — test all three variants:

- `http://localhost:3001/?nav=list` — narrow list with image backgrounds
- `http://localhost:3001/?nav=grid` — 2-column grid
- `http://localhost:3001/?nav=strip` — wide horizontal strip

Verify: hover effect darkens/lightens, links navigate correctly.

**Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: integrate ExploreDropdown into Navbar desktop view"
```

---

### Task 5: Create MobileDrawer component

**Files:**

- Create: `src/components/layout/MobileDrawer.tsx`

**Step 1: Build the drawer component**

The drawer slides in from the right. It receives `open` state and `onClose` callback. Contains the full mobile menu content: Explore activity cards, profile/auth links.

```tsx
"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useRef } from "react";

import ActivityCard from "@/components/layout/ActivityCard";

type Activity = {
  slug: string;
  label: string;
  icon: string;
  image: string;
};

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activities: Activity[];
  user: User | null;
  role: string | null;
  onLogout: () => void;
}

export default function MobileDrawer({
  open,
  onClose,
  activities,
  user,
  role,
  onLogout,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Close on swipe right inside drawer
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || !open) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 80) onClose(); // swipe right to close
    };

    drawer.addEventListener("touchstart", handleTouchStart, { passive: true });
    drawer.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      drawer.removeEventListener("touchstart", handleTouchStart);
      drawer.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-4/5 max-w-sm bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-4">
          {/* Explore Events section */}
          <div>
            <Link
              href="/events"
              onClick={onClose}
              className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Explore Events
            </Link>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.slug} onClick={onClose}>
                  <ActivityCard {...activity} className="h-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Navigation links */}
          {user ? (
            <div className="space-y-1">
              {role === "organizer" && (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Profile
              </Link>
              <Link
                href="/my-events"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                My Events
              </Link>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/signup?role=organizer"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-center"
              >
                Host Your Event
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl bg-lime-500 text-gray-900 hover:bg-lime-400 font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify it compiles**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/components/layout/MobileDrawer.tsx
git commit -m "feat: add MobileDrawer with swipe-to-close and activity cards"
```

---

### Task 6: Add swipe-to-open edge detection and page scale-down effect

**Files:**

- Modify: `src/components/layout/ClientShell.tsx`

**Step 1: Add swipe edge detection and scale wrapper**

ClientShell wraps page content. It needs to:

1. Listen for right-edge swipe-left to open the drawer
2. Apply `scale(0.95) + opacity(0.5) + border-radius` to page content when drawer is open
3. Render MobileDrawer

```tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import MobileDrawer from "@/components/layout/MobileDrawer";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const Navbar = dynamic(() => import("@/components/layout/Navbar"), {
  ssr: false,
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
const MobileNav = dynamic(() => import("@/components/layout/MobileNav"), { ssr: false });

// Activities data (shared with Navbar)
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
      // Swipe left from right edge, more horizontal than vertical
      if (startedFromEdge && deltaX < -80 && deltaY < 100) {
        setDrawerOpen(true);
      }
    };

    // Only add on mobile
    const mql = window.matchMedia("(max-width: 767px)");
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

  const handleClose = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      {/* Page content — scales down when drawer opens */}
      <div
        className={`transition-all duration-300 ${
          drawerOpen ? "scale-[0.95] opacity-50 rounded-xl overflow-hidden pointer-events-none" : ""
        }`}
      >
        <Navbar onMenuOpen={() => setDrawerOpen(true)} />
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <MobileNav />
      </div>

      {/* Mobile drawer — outside the scaled container */}
      <MobileDrawer
        open={drawerOpen}
        onClose={handleClose}
        activities={activities}
        user={null}
        role={null}
        onLogout={() => {}}
      />
    </>
  );
}
```

Note: `user`, `role`, and `onLogout` are passed as stubs here. Task 7 will lift state from Navbar to ClientShell so both share auth state.

**Step 2: Verify it compiles**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/components/layout/ClientShell.tsx
git commit -m "feat: add swipe-to-open and page scale-down effect in ClientShell"
```

---

### Task 7: Lift auth state from Navbar to ClientShell

**Files:**

- Modify: `src/components/layout/ClientShell.tsx`
- Modify: `src/components/layout/Navbar.tsx`

**Step 1: Move auth logic to ClientShell**

Move the `user`, `role`, `loading`, `fetchRole`, `handleLogout`, and auth state change listener from Navbar.tsx into ClientShell.tsx. Pass them down as props to both Navbar and MobileDrawer.

**Step 2: Update Navbar to accept props**

Change Navbar to accept `user`, `role`, `loading`, `onLogout`, `onMenuOpen` as props instead of managing its own auth state. Remove the Supabase auth logic from Navbar. Keep the `exploreOpen` and `profileOpen` dropdown state local to Navbar.

The Navbar `hamburger button` (lines 250-285) should call `onMenuOpen()` instead of `setMenuOpen(true)`. Remove the old `menuOpen` state and the entire mobile menu section (lines 289-418) from Navbar — that's now handled by MobileDrawer.

**Step 3: Update ClientShell to pass real auth state to MobileDrawer**

Replace the stub props (`user={null}`, `role={null}`, `onLogout={() => {}}`) with the real auth state.

**Step 4: Verify in browser**

Run: `npm run dev`

- Desktop: Navbar still works (explore dropdown, profile dropdown, auth buttons)
- Mobile: Hamburger opens the drawer with real auth state
- Swipe from right edge opens drawer
- Page scales down when drawer opens

**Step 5: Commit**

```bash
git add src/components/layout/ClientShell.tsx src/components/layout/Navbar.tsx
git commit -m "refactor: lift auth state to ClientShell, wire MobileDrawer"
```

---

### Task 8: Visual polish and testing

**Files:**

- Possibly adjust: `src/components/layout/ActivityCard.tsx`, `src/components/layout/ExploreDropdown.tsx`, `src/components/layout/MobileDrawer.tsx`

**Step 1: Test all three desktop variants**

Visit each in browser, verify:

- `?nav=list` — cards fit within narrow dropdown, images visible behind text, hover effect works
- `?nav=grid` — 2-column layout, cards have good aspect ratio, "All Events" spans top
- `?nav=strip` — mega-menu is centered, 5 cards side by side, doesn't overflow viewport

Adjust sizing/spacing as needed.

**Step 2: Test mobile drawer**

- Hamburger button opens drawer with slide-in animation
- Swipe from right edge opens drawer
- Swipe right inside drawer closes it
- Tap backdrop closes it
- X button closes it
- Page content scales down and dims
- Activity cards display images correctly
- All navigation links work and close the drawer
- Auth state shows correctly (logged in vs logged out)

**Step 3: Test dark mode**

Toggle dark mode, verify all three desktop variants and mobile drawer look correct.

**Step 4: Run linting and type check**

```bash
npm run lint
npm run typecheck
npm run build
```

Fix any issues.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish explore dropdown and mobile drawer"
```

---

### Task 9: Final build verification

**Step 1: Full build**

```bash
npm run build
```

Expected: Clean build, no errors.

**Step 2: Run format check**

```bash
npm run format:check
```

Expected: All files formatted.

**Step 3: Commit any remaining fixes and push**

```bash
git push -u origin feat/navbar-explore-dropdown
```
