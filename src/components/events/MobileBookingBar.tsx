"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";
import { cn } from "@/lib/utils";

interface Distance {
  id: string;
  distance_km: number;
  label: string | null;
  price: number;
}

interface MobileBookingBarProps {
  eventId: string;
  price: number;
  spotsLeft: number;
  isPast: boolean;
  distances: Distance[];
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
  distances,
  userBooking,
  membersOnly,
  isMember,
  clubSlug,
}: MobileBookingBarProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { keyboardHeight } = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;

  const hasDistances = distances.length > 0;
  const activeDistance = distances.find((d) => d.id === selectedDistance) ?? distances[0];
  const displayPrice = hasDistances ? (activeDistance?.price ?? price) : price;

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target: Node | null = e.target instanceof Node ? e.target : null;
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const hidden = sidebarVisible || keyboardOpen;

  const priceLabel = displayPrice === 0 ? "Free" : `\u20B1${displayPrice.toLocaleString()}`;

  const barClasses = cn(
    "md:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 transition-all duration-300",
    hidden && "translate-y-full opacity-0 pointer-events-none",
  );

  // Disabled states
  if (isPast) {
    return (
      <div className={barClasses}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceLabel}</span>
          <Button disabled className="min-h-[44px] px-6">
            Event Ended
          </Button>
        </div>
      </div>
    );
  }

  if (membersOnly && !isMember) {
    return (
      <div className={barClasses}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceLabel}</span>
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
      <div className={barClasses}>
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
      <div className={barClasses}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceLabel}</span>
          <Button disabled className="min-h-[44px] px-6">
            Fully Booked
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={barClasses}>
      <div className="flex items-center justify-between gap-3">
        {/* Price + optional distance selector */}
        <div className="min-w-0 flex-1" ref={dropdownRef}>
          {hasDistances ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 text-left"
              >
                <div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {priceLabel}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {activeDistance?.label || `${activeDistance?.distance_km}K`}
                    <svg
                      className="inline ml-1 w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          dropdownOpen
                            ? "M4.5 15.75l7.5-7.5 7.5 7.5"
                            : "M19.5 8.25l-7.5 7.5-7.5-7.5"
                        }
                      />
                    </svg>
                  </span>
                </div>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-950/40 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {distances.map((d) => {
                    const isSelected = d.id === (selectedDistance ?? distances[0]?.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDistance(d.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors",
                          isSelected
                            ? "bg-lime-50 dark:bg-lime-950/30 text-lime-700 dark:text-lime-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                        )}
                      >
                        <span className="font-medium">{d.label || `${d.distance_km}K`}</span>
                        <span
                          className={cn(
                            "font-semibold",
                            isSelected && "text-lime-600 dark:text-lime-400",
                          )}
                        >
                          {`\u20B1${d.price.toLocaleString()}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{priceLabel}</span>
          )}
        </div>

        <Link href={`/events/${eventId}/book`} className="shrink-0">
          <Button className="min-h-[44px] px-6 text-base font-semibold">Book Now</Button>
        </Link>
      </div>
    </div>
  );
}
