"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 10;

/**
 * Returns `true` when the user scrolls down past 50px, `false` when scrolling up.
 * Shared by MobileNav and ChatBubble so they hide/show in sync.
 */
export function useScrollHidden() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY.current;

    if (delta > SCROLL_THRESHOLD) {
      setHidden(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    } else if (delta < -SCROLL_THRESHOLD) {
      setHidden(false);
      lastScrollY.current = currentScrollY;
    }
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return hidden;
}
