"use client";

import { useEffect, useState } from "react";

interface KeyboardState {
  /** Keyboard height in pixels (0 when closed) */
  keyboardHeight: number;
  /** How far iOS has scrolled the page to show the input (visualViewport.offsetTop) */
  viewportOffset: number;
}

/**
 * Tracks the virtual keyboard height and viewport scroll offset
 * using the Visual Viewport API. Needed on iOS where the browser
 * scrolls the page when focusing inputs inside fixed elements.
 */
export function useKeyboardHeight(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({ keyboardHeight: 0, viewportOffset: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kbHeight = Math.max(0, window.innerHeight - vv.height);
      setState({
        keyboardHeight: kbHeight > 100 ? kbHeight : 0,
        viewportOffset: vv.offsetTop,
      });
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
