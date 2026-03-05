"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface NavigationContextValue {
  isNavigating: boolean;
  startNavigation: () => void;
}

const noop = () => {
  /* default no-op — overridden by NavigationProvider */
};

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  startNavigation: noop,
});

export function useNavigation() {
  return useContext(NavigationContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const SAFETY_TIMEOUT_MS = 8000;

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    // Safety: auto-clear if navigation stalls
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => {
      setIsNavigating(false);
    }, SAFETY_TIMEOUT_MS);
  }, []);

  // Clear navigation state when pathname actually changes
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setIsNavigating(false);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, []);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// NavLink — drop-in replacement for next/link with navigation tracking
// ---------------------------------------------------------------------------

type NavLinkProps = React.ComponentProps<typeof Link>;

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { onClick, href, ...rest },
  ref,
) {
  const { startNavigation } = useNavigation();
  const pathname = usePathname();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick if provided
      onClick?.(e);

      // Don't trigger navigation loader if:
      // - The click was prevented
      // - It's a modifier-key click (new tab, etc.)
      // - The href is the same as the current page
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Resolve href to a string for comparison
      const hrefStr = typeof href === "string" ? href : (href.pathname ?? "");

      // Skip if navigating to the same page
      if (hrefStr === pathname) return;

      // Skip external links and hash-only links
      if (hrefStr.startsWith("http") || hrefStr.startsWith("#")) return;

      startNavigation();
    },
    [onClick, href, pathname, startNavigation],
  );

  return <Link ref={ref} href={href} onClick={handleClick} {...rest} />;
});

export { NavLink };
