"use client";

import Link from "next/link";

import { Button } from "@/components/ui";

interface BookingButtonProps {
  eventId: string;
  spotsLeft: number;
  price: number;
  isPast?: boolean;
  userBooking?: { id: string; status: string; payment_status: string } | null;
  membersOnly?: boolean;
  isMember?: boolean;
  clubSlug?: string;
  clubName?: string;
}

export default function BookingButton({
  eventId,
  spotsLeft,
  price,
  isPast,
  userBooking,
  membersOnly,
  isMember,
  clubSlug,
  clubName,
}: BookingButtonProps) {
  if (isPast) {
    return (
      <Button disabled className="w-full" size="lg">
        Event Ended
      </Button>
    );
  }

  // Members-only gate: non-members see a join prompt instead of booking
  if (membersOnly && !isMember) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full" size="lg">
          Members Only
        </Button>
        {clubSlug && (
          <Link href={`/clubs/${clubSlug}`} className="block">
            <Button variant="secondary" className="w-full" size="sm">
              Join {clubName || "Club"} to Book
            </Button>
          </Link>
        )}
      </div>
    );
  }

  if (userBooking) {
    const isConfirmed = userBooking.status === "confirmed" || userBooking.status === "reserved";
    const needsPayment = !isConfirmed && userBooking.payment_status === "pending";

    return (
      <div className="space-y-3">
        {needsPayment ? (
          <>
            <div className="w-full rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Payment Pending
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Upload your proof to confirm your spot
              </p>
            </div>
            <Link href="/my-events" className="block">
              <Button className="w-full" size="sm">
                Upload Payment Proof
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Button disabled className="w-full" size="lg">
              {isConfirmed ? "Already Booked" : "Booking Pending"}
            </Button>
            <Link href="/my-events" className="block">
              <Button variant="outline" className="w-full" size="sm">
                View My Booking
              </Button>
            </Link>
          </>
        )}
        {spotsLeft > 0 && (
          <Link href={`/events/${eventId}/book?for=friend`} className="block">
            <Button variant="secondary" className="w-full" size="sm">
              Book for a Friend
            </Button>
          </Link>
        )}
      </div>
    );
  }

  if (spotsLeft <= 0) {
    return (
      <Button disabled className="w-full" size="lg">
        Fully Booked
      </Button>
    );
  }

  return (
    <Link href={`/events/${eventId}/book`} className="block">
      <Button className="w-full" size="lg">
        Book Now — {price === 0 ? "Free" : `₱${price.toLocaleString()}`}
      </Button>
    </Link>
  );
}
