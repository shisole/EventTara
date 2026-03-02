"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ChatIcon, CloseIcon } from "@/components/icons";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";

import ChatPanel from "./ChatPanel";

/** Collapse pill to circle after 5 seconds */
const COLLAPSE_DELAY = 5_000;

export default function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const keyboard = useKeyboardHeight();
  const keyboardOpen = keyboard.keyboardHeight > 0;

  const handleClose = useCallback(() => setOpen(false), []);
  const handleToggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), COLLAPSE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Hide on dashboard pages
  if (pathname.startsWith("/dashboard")) return null;

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

      <ChatPanel open={open} onClose={handleClose} keyboard={keyboard} />

      <button
        onClick={handleToggle}
        className={`fixed z-[60] bottom-[5.5rem] right-4 md:bottom-6 md:right-6 flex items-center justify-center rounded-full shadow-md transition-all duration-300 ease-out active:scale-95 ${
          keyboardOpen ? "!hidden" : ""
        } ${
          open
            ? "h-12 w-12 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            : collapsed
              ? "gap-0 p-3.5 bg-lime-500 text-gray-900 hover:bg-lime-400 hover:shadow-lg dark:bg-lime-500 dark:text-gray-900 dark:hover:bg-lime-400"
              : "animate-chat-bubble-in gap-2 bg-lime-500 pl-3.5 pr-4 py-3 text-gray-900 hover:bg-lime-400 hover:shadow-lg dark:bg-lime-500 dark:text-gray-900 dark:hover:bg-lime-400"
        }`}
        aria-label={open ? "Close Coco chat" : "Ask Coco"}
      >
        {open ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <>
            <ChatIcon className="h-5 w-5 shrink-0" variant="filled" />
            <span
              className={`font-heading text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                collapsed ? "max-w-0 opacity-0" : "max-w-24 opacity-100"
              }`}
            >
              Ask Coco!
            </span>
          </>
        )}
      </button>
    </>
  );
}
