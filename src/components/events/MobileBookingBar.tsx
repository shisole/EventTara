"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";
import { cn } from "@/lib/utils";

interface MobileBookingBarProps {
  eventId: string;
  price: number;
  spotsLeft: number;
  isPast: boolean;
  hasDistances: boolean;
  userBooking: { id: string; status: string; payment_status: string } | null;
  membersOnly: boolean;
  isMember: boolean;
  clubSlug?: string;
  clubName?: string;
}

export default function MobileBookingBar({
  eventId,
  price,
  spotsLeft,
  isPast,
  hasDistances,
  userBooking,
  membersOnly,
  isMember,
  clubSlug,
}: MobileBookingBarProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { keyboardHeight } = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;

  useEffect(() => {
    const el = document.querySelector("#booking-card");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSidebarVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = sidebarVisible || keyboardOpen;

  // Price display
  const priceText = hasDistances
    ? `Starting at \u20B1${price.toLocaleString()}`
    : price === 0
      ? "Free"
      : `\u20B1${price.toLocaleString()}`;

  // Disabled states
  if (isPast) {
    return (
      <div
        className={cn(
          "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
          hidden && "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceText}</span>
          <Button disabled className="min-h-[44px] px-6">
            Event Ended
          </Button>
        </div>
      </div>
    );
  }

  if (membersOnly && !isMember) {
    return (
      <div
        className={cn(
          "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
          hidden && "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceText}</span>
          {clubSlug ? (
            <Link href={`/clubs/${clubSlug}`}>
              <Button className="min-h-[44px] px-6" variant="secondary">
                Join to Book
              </Button>
            </Link>
          ) : (
            <Button disabled className="min-h-[44px] px-6">
              Members Only
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (userBooking) {
    return (
      <div
        className={cn(
          "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
          hidden && "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Already Booked
          </span>
          <Link href="/my-events">
            <Button className="min-h-[44px] px-6" variant="outline">
              View Booking
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (spotsLeft <= 0) {
    return (
      <div
        className={cn(
          "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
          hidden && "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceText}</span>
          <Button disabled className="min-h-[44px] px-6">
            Fully Booked
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
        hidden && "translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceText}</span>
        <Link href={`/events/${eventId}/book`}>
          <Button className="min-h-[44px] px-6 text-base font-semibold">Book Now</Button>
        </Link>
      </div>
    </div>
  );
}
