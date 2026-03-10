"use client";

import Link from "next/link";

import type { Database } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface NotificationItemProps {
  notification: NotificationRow & {
    actor?: { full_name: string; avatar_url: string | null; username: string | null } | null;
  };
  onMarkRead: (id: string) => void;
}

const TYPE_ICONS: Record<NotificationRow["type"], string> = {
  booking_confirmed: "🎫",
  event_reminder: "📅",
  badge_earned: "🏅",
  border_earned: "🖼️",
  feed_like: "❤️",
  feed_repost: "🔁",
  feed_comment_like: "💬",
  feed_mention: "📣",
  review_request: "⭐",
  event_published: "📢",
};

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type];

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
        notification.read
          ? "bg-white dark:bg-gray-900"
          : "bg-lime-50/50 dark:bg-lime-950/10 hover:bg-lime-50 dark:hover:bg-lime-950/20"
      } hover:bg-gray-50 dark:hover:bg-gray-800`}
    >
      <span className="text-lg mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.read && <span className="mt-2 w-2 h-2 rounded-full bg-lime-500 shrink-0" />}
    </div>
  );

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        onClick={() => {
          if (!notification.read) onMarkRead(notification.id);
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
      }}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}
