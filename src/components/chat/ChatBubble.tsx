"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ChatIcon } from "@/components/icons";
import { type Corner, useDraggable } from "@/lib/hooks/useDraggable";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";
import { useScrollHidden } from "@/lib/hooks/useScrollHidden";

import ChatPanel from "./ChatPanel";

/** Collapse pill to circle after 5 seconds */
const COLLAPSE_DELAY = 5_000;

/** Position classes when mobile nav is visible */
const cornerPositionClasses: Record<Corner, string> = {
  "bottom-right": "bottom-[5.5rem] right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-[5.5rem] left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

/** Position classes when mobile nav is hidden (scrolled down) */
const cornerHiddenNavClasses: Record<Corner, string> = {
  "bottom-right": "bottom-4 right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-4 left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

/** Raised for event detail booking bar (single-line, nav visible) */
const cornerRaisedClasses: Record<Corner, string> = {
  "bottom-right": "bottom-[10rem] right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-[10rem] left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

/** Raised for event detail booking bar (nav hidden) */
const cornerRaisedHiddenNavClasses: Record<Corner, string> = {
  "bottom-right": "bottom-[5.5rem] right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-[5.5rem] left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

/** Raised for homepage signup CTA (stacked/taller, nav visible) */
const cornerHomeCtaClasses: Record<Corner, string> = {
  "bottom-right": "bottom-[13rem] right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-[13rem] left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

/** Raised for homepage signup CTA (nav hidden) */
const cornerHomeCtaHiddenNavClasses: Record<Corner, string> = {
  "bottom-right": "bottom-[8.5rem] right-4 md:bottom-6 md:right-6",
  "bottom-left": "bottom-[8.5rem] left-4 md:bottom-6 md:left-6",
  "top-right": "top-20 right-4 md:top-6 md:right-6",
  "top-left": "top-20 left-4 md:top-6 md:left-6",
};

export default function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const keyboard = useKeyboardHeight();
  const keyboardOpen = keyboard.keyboardHeight > 0;
  const navHidden = useScrollHidden();
  const { corner, isDragging, isSnapping, dragStyle, handlers, dragRef, wasDrag } = useDraggable();

  const handleClose = useCallback(() => setOpen(false), []);
  const handleToggle = useCallback(() => {
    // Don't toggle if we just finished dragging
    if (wasDrag) return;
    setOpen((prev) => !prev);
  }, [wasDrag]);

  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), COLLAPSE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Raise bubble when a mobile floating bar is present (event detail booking bar,
  // or the homepage signup CTA once the user has scrolled past the hero)
  const [homeCtaVisible, setHomeCtaVisible] = useState(false);
  useEffect(() => {
    if (pathname !== "/") {
      setHomeCtaVisible(false);
      return;
    }
    const onScroll = () => {
      setHomeCtaVisible(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Hide on dashboard pages
  if (pathname.startsWith("/dashboard")) return null;

  const hasEventBookingBar = /^\/events\/[^/]+$/.test(pathname);
  const cornerClasses = homeCtaVisible
    ? navHidden
      ? cornerHomeCtaHiddenNavClasses
      : cornerHomeCtaClasses
    : hasEventBookingBar
      ? navHidden
        ? cornerRaisedHiddenNavClasses
        : cornerRaisedClasses
      : navHidden
        ? cornerHiddenNavClasses
        : cornerPositionClasses;
  const positionClasses = dragStyle ? "" : cornerClasses[corner];
  const transitionClasses = isDragging
    ? ""
    : isSnapping
      ? "transition-all duration-300"
      : "transition-all duration-300 ease-out";

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`fixed inset-0 z-999 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <ChatPanel open={open} onClose={handleClose} keyboard={keyboard} corner={corner} />

      <button
        ref={dragRef}
        onClick={handleToggle}
        {...handlers}
        className={`fixed z-[60] touch-none ${positionClasses} flex items-center justify-center rounded-full ${transitionClasses} active:scale-95 ${
          keyboardOpen || open ? "!hidden" : ""
        } ${isDragging ? "cursor-grabbing scale-110" : "cursor-grab"} ${
          collapsed
            ? "gap-0 p-3 bg-white/12 text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/18 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:bg-white/12 dark:text-white/90 dark:hover:bg-white/20"
            : "animate-chat-bubble-in gap-2 bg-white/12 pl-3.5 pr-4 py-3 text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/18 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:bg-white/12 dark:text-white/90 dark:hover:bg-white/20"
        }`}
        style={dragStyle}
        aria-label={open ? "Close Coco chat" : "Ask Coco"}
      >
        <ChatIcon className="h-5 w-5 shrink-0" />
        <span
          className={`font-heading text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
            collapsed ? "max-w-0 opacity-0" : "max-w-24 opacity-100"
          }`}
        >
          Ask Coco!
        </span>
      </button>
    </>
  );
}
