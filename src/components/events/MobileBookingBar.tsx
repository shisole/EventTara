"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { useKeyboardHeight } from "@/lib/hooks/useKeyboardHeight";
import { useScrollHidden } from "@/lib/hooks/useScrollHidden";
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
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { keyboardHeight } = useKeyboardHeight();
  const keyboardOpen = keyboardHeight > 0;
  const navHidden = useScrollHidden();

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

  const hasDistances = distances.length > 0;
  const activeDistance = distances.find((d) => d.id === selectedDistance) ?? distances[0];
  const displayPrice = hasDistances ? (activeDistance?.price ?? price) : price;
  const priceLabel = displayPrice === 0 ? "Free" : `\u20B1${displayPrice.toLocaleString()}`;

  const ctaState = isPast
    ? "past"
    : membersOnly && !isMember
      ? "members-only"
      : userBooking
        ? "booked"
        : spotsLeft <= 0
          ? "full"
          : "available";

  return (
    <div
      className={cn(
        "md:hidden sticky z-40 px-4 py-3 transition-[bottom] duration-300",
        keyboardOpen && "hidden",
        navHidden ? "bottom-2 pb-[env(safe-area-inset-bottom,0px)]" : "bottom-16",
      )}
    >
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-950/40 px-2 py-2 flex items-center justify-between gap-3">
        {ctaState === "available" ? (
          <>
            <div className="min-w-0 flex-1 relative" ref={dropdownRef}>
              {hasDistances ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2.5 text-left min-h-[44px] pl-3"
                  >
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {priceLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {activeDistance?.label || `${activeDistance?.distance_km}K`}
                      <svg
                        className="w-3 h-3"
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
                  </button>

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
                </>
              ) : (
                <span className="pl-3 text-base font-bold text-gray-900 dark:text-gray-100">
                  {priceLabel}
                </span>
              )}
            </div>
            <Link href={`/events/${eventId}/book`} className="shrink-0">
              <Button className="rounded-xl min-h-[48px] px-8 text-base font-semibold">
                Book Now
              </Button>
            </Link>
          </>
        ) : ctaState === "booked" ? (
          <>
            <span className="pl-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Already Booked
            </span>
            <Link href="/my-events" className="shrink-0">
              <Button className="rounded-xl min-h-[48px] px-8" variant="outline">
                View Booking
              </Button>
            </Link>
          </>
        ) : (
          <>
            <span className="pl-3 text-base font-bold text-gray-900 dark:text-gray-100">
              {priceLabel}
            </span>
            {ctaState === "members-only" && clubSlug ? (
              <Link href={`/clubs/${clubSlug}`} className="shrink-0">
                <Button className="rounded-xl min-h-[48px] px-8" variant="secondary">
                  Join to Book
                </Button>
              </Link>
            ) : (
              <Button disabled className="rounded-xl min-h-[48px] px-8">
                {ctaState === "past"
                  ? "Event Ended"
                  : ctaState === "full"
                    ? "Fully Booked"
                    : "Members Only"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
