"use client";

import Link from "next/link";

import NotificationItem from "@/components/notifications/NotificationItem";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface NotificationDropdownProps {
  notifications: (NotificationRow & {
    actor?: { full_name: string; avatar_url: string | null; username: string | null } | null;
  })[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className="fixed inset-0 z-[59] bg-black/40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-x-3 top-16 z-[60] sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
          {hasUnread && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} />
            ))
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block px-4 py-2.5 text-center text-sm font-medium text-lime-600 dark:text-lime-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
}
