"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { ChatIcon, CloseIcon } from "@/components/icons";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";

import ChatPanel from "./ChatPanel";

export default function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardHeight();
  const keyboardOpen = keyboard.keyboardHeight > 0;

  const handleClose = useCallback(() => setOpen(false), []);
  const handleToggle = useCallback(() => setOpen((prev) => !prev), []);

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
        className={`fixed z-[60] bottom-[5.5rem] right-4 md:bottom-6 md:right-6 flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${
          keyboardOpen ? "!hidden" : ""
        } ${
          open
            ? "h-14 w-14 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            : "animate-chat-bubble-in gap-2 rounded-full bg-lime-500 pl-3.5 pr-4 py-3 text-gray-900 hover:bg-lime-400 hover:shadow-xl hover:scale-105 dark:bg-lime-500 dark:text-gray-900 dark:hover:bg-lime-400"
        }`}
        aria-label={open ? "Close Coco chat" : "Ask Coco"}
      >
        {open ? (
          <div className="transition-transform duration-300 rotate-180">
            <CloseIcon className="h-6 w-6" />
          </div>
        ) : (
          <>
            <ChatIcon className="h-5 w-5" variant="filled" />
            <span className="font-heading text-sm font-bold">Ask Coco!</span>
          </>
        )}
      </button>
    </>
  );
}
