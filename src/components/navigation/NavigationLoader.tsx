"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useNavigation } from "@/components/navigation/NavigationContext";

const OVERLAY_DELAY_MS = 150;

export default function NavigationLoader() {
  const { isNavigating } = useNavigation();
  const [showOverlay, setShowOverlay] = useState(false);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNavigating) {
      // Delay showing full overlay so fast navigations don't flash
      delayTimer.current = setTimeout(() => {
        setShowOverlay(true);
      }, OVERLAY_DELAY_MS);
    } else {
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }
      setShowOverlay(false);
    }

    return () => {
      if (delayTimer.current) clearTimeout(delayTimer.current);
    };
  }, [isNavigating]);

  return (
    <>
      {/* Top progress bar — shows immediately for instant feedback */}
      {isNavigating && (
        <div className="fixed inset-x-0 top-0 z-[9999] h-0.5" role="progressbar">
          <div className="h-full w-full bg-lime-500 origin-left animate-nav-progress" />
        </div>
      )}

      {/* Full-screen overlay — shows after delay for slower navigations */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm animate-fade-in"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <div className="flex flex-col items-center gap-3 animate-logo-pulse">
            <Image
              src="/favicon-192x192.png"
              alt="EventTara"
              width={48}
              height={48}
              className="rounded-xl"
              priority
            />
            <span
              className="text-2xl font-cursive font-bold text-lime-500"
              style={{ WebkitTextStroke: "0.5px currentColor" }}
            >
              EventTara
            </span>
          </div>
          <span className="sr-only">Loading page...</span>
        </div>
      )}
    </>
  );
}
