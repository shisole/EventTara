"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Full-screen loader shown during route transitions.
 * Displays the EventTara logo with a pulse animation.
 *
 * Uses a patched pushState + popstate listener to detect navigation start,
 * and hides when the pathname settles. Only triggers on path changes, not
 * search param changes (so filters on /events won't flash the loader).
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect navigation start by intercepting pushState / replaceState
  useEffect(() => {
    const showLoader = (url?: string | URL | null) => {
      // Only show for path changes, not search param changes
      const newPath = url ? new URL(url.toString(), globalThis.location.origin).pathname : null;
      if (newPath && newPath === prevPathname.current) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVisible(true);
    };

    // Patch history methods to detect programmatic navigation
    const originalPush = globalThis.history.pushState.bind(globalThis.history);
    const originalReplace = globalThis.history.replaceState.bind(globalThis.history);

    globalThis.history.pushState = function (...args: Parameters<typeof originalPush>) {
      showLoader(args[2]);
      return originalPush(...args);
    };

    globalThis.history.replaceState = function (...args: Parameters<typeof originalReplace>) {
      showLoader(args[2]);
      return originalReplace(...args);
    };

    // Detect browser back/forward
    const handlePopState = () => {
      if (globalThis.location.pathname !== prevPathname.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(true);
      }
    };
    globalThis.addEventListener("popstate", handlePopState);

    return () => {
      globalThis.history.pushState = originalPush;
      globalThis.history.replaceState = originalReplace;
      globalThis.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Hide loader when the pathname settles
  useEffect(() => {
    if (pathname === prevPathname.current) {
      setVisible(false);
    } else {
      prevPathname.current = pathname;
      // Small delay so the new page has time to paint
      timeoutRef.current = setTimeout(() => setVisible(false), 100);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/favicon-192x192.png"
          alt="EventTara"
          width={64}
          height={64}
          className="animate-pulse rounded-xl"
          priority
        />
        <span className="text-lg font-heading font-bold text-lime-500 animate-pulse">
          EventTara
        </span>
      </div>
    </div>
  );
}
