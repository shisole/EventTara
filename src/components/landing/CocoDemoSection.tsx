"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatIcon, SendIcon } from "@/components/icons";
import { UIBadge } from "@/components/ui";
import { getActivityLabel } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

interface MiniEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
}

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
  events?: MiniEvent[];
  totalCount?: number;
  filterUrl?: string;
}

interface MockConversation {
  prompt: string;
  response: DemoMessage;
}

// Mock data — no API calls
const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    prompt: "Hiking near me",
    response: {
      role: "assistant",
      content: "Here are some upcoming hiking events near you!",
      events: [
        {
          id: "demo-1",
          title: "Mt. Batulao Day Hike",
          type: "hiking",
          date: "2026-03-22T05:00:00Z",
          location: "Nasugbu, Batangas",
          price: 800,
          cover_image_url: null,
        },
        {
          id: "demo-2",
          title: "Mt. Maculot Traverse",
          type: "hiking",
          date: "2026-03-29T04:30:00Z",
          location: "Cuenca, Batangas",
          price: 1200,
          cover_image_url: null,
        },
      ],
      totalCount: 12,
      filterUrl: "/events?type=hiking&when=upcoming",
    },
  },
  {
    prompt: "Trail running this weekend",
    response: {
      role: "assistant",
      content: "Here are trail running events happening this weekend!",
      events: [
        {
          id: "demo-3",
          title: "Rizal Trail Run 21K",
          type: "trail_run",
          date: "2026-03-15T04:00:00Z",
          location: "Tanay, Rizal",
          price: 1500,
          cover_image_url: null,
        },
        {
          id: "demo-4",
          title: "Timberland Trail Series",
          type: "trail_run",
          date: "2026-03-15T05:00:00Z",
          location: "San Mateo, Rizal",
          price: 900,
          cover_image_url: null,
        },
      ],
      totalCount: 5,
      filterUrl: "/events?type=trail_run&when=upcoming",
    },
  },
  {
    prompt: "Easy beginner hikes",
    response: {
      role: "assistant",
      content: "Great choice for getting started! Here are some beginner-friendly hikes:",
      events: [
        {
          id: "demo-5",
          title: "Mt. Gulugod Baboy Dayhike",
          type: "hiking",
          date: "2026-04-05T05:00:00Z",
          location: "Mabini, Batangas",
          price: 600,
          cover_image_url: null,
        },
        {
          id: "demo-6",
          title: "Masungi Georeserve Trek",
          type: "hiking",
          date: "2026-04-12T06:00:00Z",
          location: "Baras, Rizal",
          price: 1800,
          cover_image_url: null,
        },
      ],
      totalCount: 8,
      filterUrl: "/events?type=hiking&difficulty=1-4&when=upcoming",
    },
  },
  {
    prompt: "Mountain biking events",
    response: {
      role: "assistant",
      content: "Here are upcoming mountain biking events across the Philippines!",
      events: [
        {
          id: "demo-7",
          title: "Bike & Brew MTB Ride",
          type: "mtb",
          date: "2026-03-22T06:00:00Z",
          location: "Nuvali, Laguna",
          price: 500,
          cover_image_url: null,
        },
        {
          id: "demo-8",
          title: "Timberland MTB Challenge",
          type: "mtb",
          date: "2026-04-05T05:30:00Z",
          location: "San Mateo, Rizal",
          price: 1200,
          cover_image_url: null,
        },
      ],
      totalCount: 6,
      filterUrl: "/events?type=mtb&when=upcoming",
    },
  },
];

// Fallback for free-text input
const FALLBACK_RESPONSE: DemoMessage = {
  role: "assistant",
  content:
    "I'd love to help you find events! Try tapping one of the suggestions above, or sign up to use the full Coco experience.",
};

function DemoEventCard({ id, title, type, date, location, price, cover_image_url }: MiniEvent) {
  return (
    <Link
      href={`/events/${id}`}
      className="flex gap-3 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-750"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
        {cover_image_url ? (
          <Image src={cover_image_url} alt={title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5">
          <UIBadge variant={type} className="text-[10px] px-1.5 py-0">
            {getActivityLabel(type)}
          </UIBadge>
        </div>
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {formatEventDate(date, null, { short: true })} &middot; {location}
        </p>
        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
          {price === 0 ? "Free" : `₱${price.toLocaleString()}`}
        </p>
      </div>
    </Link>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 dark:bg-gray-700">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

const INTRO_MESSAGE: DemoMessage = {
  role: "assistant",
  content:
    "Hi! I'm Coco, your adventure guide. Ask me about hiking, biking, running, or trail running events across the Philippines!",
};

export default function CocoDemoSection() {
  const [messages, setMessages] = useState<DemoMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: DemoMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      // Find matching mock conversation (case-insensitive)
      const lower = trimmed.toLowerCase();
      const match = MOCK_CONVERSATIONS.find((c) => c.prompt.toLowerCase() === lower);

      // Simulate typing delay (800–1200ms)
      const delay = 800 + Math.random() * 400;
      timeoutRef.current = setTimeout(() => {
        setMessages((prev) => [...prev, match ? match.response : FALLBACK_RESPONSE]);
        setLoading(false);
        if (match) {
          setUsedPrompts((prev) => new Set(prev).add(match.prompt));
        }
      }, delay);
    },
    [loading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  // Only show suggestions that haven't been used yet
  const availablePrompts = MOCK_CONVERSATIONS.filter((c) => !usedPrompts.has(c.prompt)).map(
    (c) => c.prompt,
  );

  return (
    <section className="relative overflow-hidden bg-slate-900 py-20 sm:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-lime-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-lime-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="w-full lg:w-[45%] text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 text-xs font-semibold tracking-wide uppercase mb-6">
              <ChatIcon className="w-3.5 h-3.5" variant="filled" />
              AI-Powered
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-5 leading-tight">
              Meet <span className="text-lime-400">Coco</span>, Your
              <br className="hidden sm:block" /> Adventure Guide
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed mb-8">
              Not sure where to go next? Just ask Coco. Our AI assistant searches hundreds of events
              to find the perfect match for your next outdoor adventure.
            </p>

            <div className="space-y-4 text-left">
              {[
                {
                  icon: "🔍",
                  title: "Smart Search",
                  desc: "Understands natural language — ask like you'd ask a friend",
                },
                {
                  icon: "📍",
                  title: "Location-Aware",
                  desc: "Finds events near you or in any region of the Philippines",
                },
                {
                  icon: "⚡",
                  title: "Instant Results",
                  desc: "Get event recommendations with details, dates, and pricing",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 items-start">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — interactive chat (mocked) */}
          <div className="w-full lg:w-[55%]">
            <div className="mx-auto max-w-md lg:max-w-none">
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                {/* Chat header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-lime-500 flex items-center justify-center">
                    <ChatIcon className="w-5 h-5 text-slate-900" variant="filled" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">Coco</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-lime-500/20 text-lime-400">
                        BETA
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">Your AI adventure guide</p>
                  </div>
                </div>

                {/* Messages area */}
                <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex animate-chat-message-in",
                          isUser ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                            isUser
                              ? "bg-lime-500 text-gray-900 rounded-br-md"
                              : "bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-md shadow-sm",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {msg.events && msg.events.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.events.map((event) => (
                                <DemoEventCard key={event.id} {...event} />
                              ))}

                              {msg.totalCount != null &&
                                msg.totalCount > msg.events.length &&
                                msg.filterUrl && (
                                  <Link
                                    href={msg.filterUrl}
                                    className="block text-center text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 py-1"
                                  >
                                    View all {msg.totalCount} results &rarr;
                                  </Link>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested prompts */}
                {availablePrompts.length > 0 && !loading && (
                  <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSuggestion(prompt)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-lime-50 hover:text-lime-700 dark:hover:bg-lime-500/10 dark:hover:text-lime-400 transition-colors border border-gray-200 dark:border-gray-600 hover:border-lime-300 dark:hover:border-lime-500/30"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Where's your next adventure?"
                    disabled={loading}
                    maxLength={200}
                    className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-lime-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-lime-500 text-slate-900 hover:bg-lime-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
