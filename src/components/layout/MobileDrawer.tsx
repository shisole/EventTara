"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { CloseIcon } from "@/components/icons";
import ActivityCard from "@/components/layout/ActivityCard";

interface Activity {
  slug: string;
  label: string;
  icon: string;
  image: string;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activities: Activity[];
  user: User | null;
  role: string | null;
  onLogout: () => void;
}

export default function MobileDrawer({
  open,
  onClose,
  activities,
  user,
  role,
  onLogout,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Close on swipe right inside drawer
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || !open) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 80) onClose(); // swipe right to close
    };

    drawer.addEventListener("touchstart", handleTouchStart, { passive: true });
    drawer.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      drawer.removeEventListener("touchstart", handleTouchStart);
      drawer.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-4/5 max-w-sm bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-4">
          {/* Explore Events section */}
          <div>
            <Link
              href="/events"
              onClick={onClose}
              className="block text-sm font-semibold text-gray-900 dark:text-white mb-2"
            >
              Explore Events
            </Link>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.slug} onClick={onClose}>
                  <ActivityCard {...activity} className="h-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Navigation links */}
          {user ? (
            <div className="space-y-1">
              {role === "organizer" && (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Profile
              </Link>
              <Link
                href="/my-events"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                My Events
              </Link>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/signup?role=organizer"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-center"
              >
                Host Your Event
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block px-4 py-3 rounded-xl bg-lime-500 text-gray-900 hover:bg-lime-400 font-semibold text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
