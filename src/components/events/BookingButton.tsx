"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

interface BookingButtonProps {
  eventId: string;
  spotsLeft: number;
  price: number;
  isPast?: boolean;
  userBooking?: { id: string; status: string; payment_status: string } | null;
}

export default function BookingButton({ eventId, spotsLeft, price, isPast, userBooking }: BookingButtonProps) {
  if (isPast) {
    return (
      <Button disabled className="w-full" size="lg">
        Event Ended
      </Button>
    );
  }

  if (userBooking) {
    const statusLabel = userBooking.status === "confirmed" ? "Already Booked" : "Booking Pending";
    return (
      <div className="space-y-3">
        <Button disabled className="w-full" size="lg">
          {statusLabel}
        </Button>
        <Link href="/my-events" className="block">
          <Button variant="outline" className="w-full" size="sm">
            View My Booking
          </Button>
        </Link>
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
