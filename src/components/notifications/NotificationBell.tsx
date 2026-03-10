"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BellIcon } from "@/components/icons";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationWithActor = NotificationRow & {
  actor?: { full_name: string; avatar_url: string | null; username: string | null } | null;
};

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and when window regains focus
  useEffect(() => {
    const fetchCount = () =>
      fetch("/api/notifications/unread-count")
        .then((res) => res.json())
        .then((data: { count?: number }) => setUnreadCount(data.count ?? 0))
        .catch(() => null);

    void fetchCount();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void fetchCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Supabase realtime payload.new is untyped
          const newNotification = payload.new as NotificationWithActor;
          setUnreadCount((prev) => prev + 1);
          setNotifications((prev) => [newNotification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=15");
      const data: { notifications?: NotificationWithActor[] } = await res.json();
      // Mark all as read locally since we clear badge on open
      setNotifications((data.notifications ?? []).map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      void fetchNotifications();
      // Clear badge on open — user has "seen" notifications
      if (unreadCount > 0) {
        setUnreadCount(0);
        void fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
      }
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => null);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    void fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" variant={open ? "filled" : "outline"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
