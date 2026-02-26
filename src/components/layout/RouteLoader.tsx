"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Full-screen loader shown during route transitions.
 * Displays the EventTara logo with a pulse animation.
 *
 * Uses a patched pushState/replaceState + popstate listener to detect
 * navigation start, and hides when pathname/searchParams settle.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const prevUrl = useRef(pathname + "?" + searchParams.toString());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect navigation start by intercepting pushState / replaceState
  useEffect(() => {
    const showLoader = () => {
      // Clear any pending hide
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVisible(true);
    };

    // Patch history methods to detect programmatic navigation
    const originalPush = globalThis.history.pushState.bind(globalThis.history);
    const originalReplace = globalThis.history.replaceState.bind(globalThis.history);

    globalThis.history.pushState = function (...args: Parameters<typeof originalPush>) {
      showLoader();
      return originalPush(...args);
    };

    globalThis.history.replaceState = function (...args: Parameters<typeof originalReplace>) {
      // Only show loader if the URL actually changes
      const newUrl = args[2]?.toString();
      if (newUrl && newUrl !== globalThis.location.pathname + globalThis.location.search) {
        showLoader();
      }
      return originalReplace(...args);
    };

    // Detect browser back/forward
    const handlePopState = () => showLoader();
    globalThis.addEventListener("popstate", handlePopState);

    return () => {
      globalThis.history.pushState = originalPush;
      globalThis.history.replaceState = originalReplace;
      globalThis.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Hide loader when the route settles
  useEffect(() => {
    const currentUrl = pathname + "?" + searchParams.toString();
    if (currentUrl === prevUrl.current) {
      // Same URL (e.g. initial mount) — make sure it's hidden
      setVisible(false);
    } else {
      prevUrl.current = currentUrl;
      // Small delay so the new page has time to paint
      timeoutRef.current = setTimeout(() => setVisible(false), 100);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

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
