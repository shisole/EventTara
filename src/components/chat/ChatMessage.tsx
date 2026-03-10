import Link from "next/link";

import ChatEventCard from "./ChatEventCard";
import type { ChatMessage as ChatMessageType } from "./types";

const TOOL_LABELS: Record<string, string> = {
  searchEvents: "Searching events...",
  getEventDetails: "Getting event details...",
  getEventRoute: "Checking route info...",
  getUserBookings: "Checking your bookings...",
  getUserBadges: "Looking up badges...",
  getClubInfo: "Getting club info...",
  getUserClubs: "Checking your clubs...",
  getLeaderboard: "Loading leaderboard...",
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const activeTools = message.toolCalls?.filter((t) => t.status === "running") ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
          isUser
            ? "bg-lime-500 text-gray-900 rounded-br-md"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-md"
        }`}
      >
        {/* Tool activity indicators */}
        {activeTools.length > 0 && (
          <div className="mb-1.5 space-y-0.5">
            {activeTools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-500 animate-pulse" />
                {TOOL_LABELS[tool.name] ?? `Running ${tool.name}...`}
              </div>
            ))}
          </div>
        )}

        <p className="whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-300 animate-pulse align-text-bottom" />
          )}
        </p>

        {message.events && message.events.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.events.map((event) => (
              <ChatEventCard key={event.id} {...event} />
            ))}

            {message.totalCount != null &&
              message.totalCount > message.events.length &&
              message.filterUrl && (
                <Link
                  href={message.filterUrl}
                  className="block text-center text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 py-1"
                >
                  View all {message.totalCount} results &rarr;
                </Link>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
