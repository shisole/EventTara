"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

interface BookingButtonProps {
  eventId: string;
  spotsLeft: number;
  price: number;
  isPast?: boolean;
}

export default function BookingButton({ eventId, spotsLeft, price, isPast }: BookingButtonProps) {
  if (isPast) {
    return (
      <Button disabled className="w-full" size="lg">
        Event Ended
      </Button>
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
