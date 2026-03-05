# Navigation Loading Overlay — Full-Screen Logo Pulse

**Date:** 2026-03-05
**Status:** Approved
**Approach:** A — `usePathname()` route change detection in ClientShell, zero dependencies

## Problem

When clicking links on EventTara, there's a perceived delay where nothing visually happens while the next page loads. Users need immediate visual feedback.

## Design

### Architecture

- **`NavigationContext`** — React context providing `{ isNavigating, startNavigation }`
- **`NavigationProvider`** — wraps app inside ClientShell, listens to `usePathname()` to auto-clear loading state
- **`NavigationLoader`** — full-screen overlay (favicon + "EventTara" text, pulsing)
- **`NavLink`** — thin wrapper around `next/link` that calls `startNavigation()` on click

### Behavior

1. User clicks `NavLink` → `startNavigation()` called
2. After 150ms delay, if still navigating → show overlay with fade-in
3. Overlay: semi-transparent backdrop, centered favicon + "EventTara" text with pulse animation
4. `pathname` changes → idle → overlay fades out
5. Safety timeout (8s): auto-hide if navigation stalls

### Overlay Visual

- Fixed fullscreen, `z-[60]` (above navbar z-50)
- Backdrop: `bg-white/80 dark:bg-gray-950/80` + `backdrop-blur-sm`
- Center: favicon (48x48) + "EventTara" lime-500 cursive
- Pulse: `scale(0.95→1.05)` + `opacity(0.6→1)`, 1.2s infinite
- Fade in/out: 200ms ease

### Files

- **New:** `src/components/navigation/NavigationContext.tsx`
- **New:** `src/components/navigation/NavigationLoader.tsx`
- **Modify:** `src/components/layout/ClientShell.tsx` — add NavigationProvider + NavigationLoader
- **Modify:** `src/components/layout/Navbar.tsx` — use NavLink
- **Modify:** `src/components/layout/MobileNav.tsx` — use NavLink
- **Modify:** `tailwind.config.ts` — add logoPulse animation
- **Audit:** Other Link usages site-wide
