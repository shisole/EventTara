import Link from "next/link";

import ChatEventCard from "./ChatEventCard";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
          isUser
            ? "bg-lime-500 text-gray-900 rounded-br-md"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

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
