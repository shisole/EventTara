"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current virtual keyboard height in pixels using the Visual Viewport API.
 * Returns 0 on desktop or when the keyboard is closed.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // When the keyboard is open, visualViewport.height shrinks.
      // The keyboard height is the difference between the window and viewport heights.
      const kbHeight = Math.max(0, window.innerHeight - vv.height);
      // Only treat as keyboard if the difference is meaningful (> 100px)
      // to avoid false positives from browser chrome changes.
      setKeyboardHeight(kbHeight > 100 ? kbHeight : 0);
    };

    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  return keyboardHeight;
}
