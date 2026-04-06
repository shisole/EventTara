"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CloseIcon, SendIcon } from "@/components/icons";
import { type Corner } from "@/lib/hooks/useDraggable";

import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType, ChatResponse } from "./types";

const DAILY_LIMIT = 5;
const STORAGE_KEY = "eventtara_chat_queries";

function getUsedToday(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const parsed: { date: string; count: number } = JSON.parse(stored);
    const { date, count } = parsed;
    const today = new Date().toISOString().split("T")[0];
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

function incrementUsed(): void {
  const today = new Date().toISOString().split("T")[0];
  const current = getUsedToday();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: current + 1 }));
}

interface KeyboardState {
  keyboardHeight: number;
  viewportOffset: number;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  keyboard?: KeyboardState;
  corner?: Corner;
}

const PANEL_MAX_HEIGHT = 460;

/** Desktop panel position based on bubble corner */
const panelDesktopClasses: Record<Corner, string> = {
  "bottom-right": "md:top-auto md:left-auto md:right-[5.25rem] md:bottom-6",
  "bottom-left": "md:top-auto md:right-auto md:left-[5.25rem] md:bottom-6",
  "top-right": "md:bottom-auto md:left-auto md:right-[5.25rem] md:top-[4.5rem]",
  "top-left": "md:bottom-auto md:right-auto md:left-[5.25rem] md:top-[4.5rem]",
};

export default function ChatPanel({
  open,
  onClose,
  keyboard,
  corner = "bottom-right",
}: ChatPanelProps) {
  const searchParams = useSearchParams();
  const unlimitedChat = useMemo(() => searchParams.get("chat_debug") === "1", [searchParams]);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: "assistant",
      content:
        'Hey there! I\'m Coco, your friendly EventTara assistant. Ask me anything about events and I\'ll help you find your next adventure! Try:\n\n"hiking near Mt. Madias next week"\n"MTB events this weekend in Iloilo"\n"trail running events in Antique"',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(DAILY_LIMIT);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Request geolocation once on first open (used when user sends a message)
  useEffect(() => {
    if (!open || locationRef.current) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      () => {
        // Geolocation denied or unavailable — continue without it
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [open]);

  // Read persisted usage on mount
  useEffect(() => {
    if (unlimitedChat) {
      setRemaining(DAILY_LIMIT);
    } else {
      setRemaining(DAILY_LIMIT - getUsedToday());
    }
  }, [unlimitedChat]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessageType = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = { message: trimmed };
      if (locationRef.current) {
        payload.lat = locationRef.current.lat;
        payload.lng = locationRef.current.lng;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ChatResponse = await res.json();

      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.reply ||
              "You've used all your searches for today. Come back tomorrow for more adventures!",
          },
        ]);
        setRemaining(0);
        return;
      }

      if (data.error && res.status !== 200) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Please try again." },
        ]);
        return;
      }

      const assistantMessage: ChatMessageType = {
        role: "assistant",
        content: data.reply,
        events: data.events,
        totalCount: data.totalCount,
        filterUrl: data.filterUrl,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (!unlimitedChat) {
        incrementUsed();
        setRemaining(DAILY_LIMIT - getUsedToday());
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not connect to the search service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const limitDots = Array.from({ length: DAILY_LIMIT }, (_, i) => i < remaining);

  const kbHeight = keyboard?.keyboardHeight ?? 0;
  const viewportOffset = keyboard?.viewportOffset ?? 0;
  const keyboardOpen = kbHeight > 0;

  // When the keyboard opens on mobile, keep the sheet anchored to the bottom
  // of the visible viewport and shrink it to fit. On iOS the visual viewport
  // shifts, so we use viewportOffset + visible height to position correctly.
  // Desktop keeps the old top-based positioning for the floating panel.
  const isMobile = typeof globalThis !== "undefined" && window.innerWidth < 768;
  const keyboardStyle: React.CSSProperties | undefined = keyboardOpen
    ? isMobile
      ? {
          // Mobile bottom sheet: stay at bottom, shrink height to visible area
          bottom: `${kbHeight}px`,
          height: `${Math.min(window.innerHeight - kbHeight - 40, window.innerHeight * 0.75)}px`,
        }
      : {
          // Desktop floating panel: top-based positioning
          top: `${viewportOffset + (window.innerHeight - kbHeight) - PANEL_MAX_HEIGHT}px`,
          bottom: "auto",
          height: `${PANEL_MAX_HEIGHT}px`,
        }
    : undefined;

  const desktopClasses = panelDesktopClasses[corner];

  return (
    <div
      className={`fixed transition-all duration-300 ease-out ${
        open
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none translate-y-full md:translate-y-2"
      } z-[999] left-0 right-0 bottom-0 h-[75dvh] md:z-[60] md:w-[400px] md:h-[min(500px,calc(100dvh-6rem))] ${desktopClasses}`}
      style={keyboardStyle}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-t-2xl md:rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-lime-50 to-teal-50 px-4 py-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-sm font-bold text-gray-900 dark:text-gray-100">
                Coco
              </h3>
              <span className="rounded-full bg-lime-500 px-2 py-0.5 text-[10px] font-bold leading-none text-gray-900">
                BETA
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered assistant</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Limit dots */}
            <div
              className="flex items-center gap-1"
              title={`${remaining} of ${DAILY_LIMIT} searches remaining`}
            >
              {limitDots.map((active, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    active ? "bg-lime-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close chat"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="animate-chat-message-in">
              <ChatMessage message={msg} />
            </div>
          ))}

          {loading && (
            <div className="animate-chat-message-in flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 dark:bg-gray-700">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-3 py-2.5 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remaining > 0 ? "Where's your next adventure?" : "Daily limit reached"}
              maxLength={500}
              disabled={loading || remaining === 0}
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-lime-400 focus:bg-white focus:shadow-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-lime-500 dark:focus:bg-gray-750"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || loading || remaining === 0}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-lime-500 text-gray-900 transition-all duration-200 hover:bg-lime-400 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-gray-400 dark:text-gray-500">
            {remaining > 0
              ? `${remaining} of ${DAILY_LIMIT} search${remaining === 1 ? "" : "es"} remaining`
              : "Come back tomorrow for more searches!"}
          </p>
        </div>
      </div>
    </div>
  );
}
