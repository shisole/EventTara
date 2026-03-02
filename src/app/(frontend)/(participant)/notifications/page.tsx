"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui";
import { type Database } from "@/lib/supabase/types";

const PushNotificationManager = dynamic(
  () => import("@/components/notifications/PushNotificationManager"),
);

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationWithActor = NotificationRow & {
  actor?: { full_name: string; avatar_url: string | null; username: string | null } | null;
};

const PAGE_SIZE = 20;

function groupByDate(notifications: NotificationWithActor[]) {
  const groups: { label: string; items: NotificationWithActor[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentLabel = "";
  let currentItems: NotificationWithActor[] = [];

  for (const n of notifications) {
    const date = new Date(n.created_at);
    date.setHours(0, 0, 0, 0);

    let label: string;
    if (date.getTime() === today.getTime()) {
      label = "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    if (label === currentLabel) {
      currentItems.push(n);
    } else {
      if (currentItems.length > 0) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [n];
    }
  }

  if (currentItems.length > 0) {
    groups.push({ label: currentLabel, items: currentItems });
  }

  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (offset: number) => {
    try {
      const res = await fetch(
        `/api/notifications?offset=${String(offset)}&limit=${String(PAGE_SIZE)}`,
      );
      const data: { notifications?: NotificationWithActor[] } = await res.json();
      const items: NotificationWithActor[] = data.notifications ?? [];
      if (items.length < PAGE_SIZE) setHasMore(false);
      setNotifications((prev) => (offset === 0 ? items : [...prev, ...items]));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchNotifications(0);
  }, [fetchNotifications]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          offsetRef.current += PAGE_SIZE;
          setLoading(true);
          void fetchNotifications(offsetRef.current);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchNotifications]);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => null);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
  };

  const hasUnread = notifications.some((n) => !n.read);
  const groups = groupByDate(notifications);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mb-6">
        <PushNotificationManager />
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You&apos;ll see notifications here when something happens.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {group.items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && <div ref={loaderRef} className="h-10" />}
      {loading && notifications.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
