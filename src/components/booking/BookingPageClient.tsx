"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import BookingForm from "./BookingForm";
import type { EventDistance } from "./BookingForm";

const AuthBookingModal = dynamic(() => import("./AuthBookingModal"), { ssr: false });

interface BookingPageClientProps {
  isAuthenticated: boolean;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string | null;
  price: number;
  organizerPaymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft: number;
  distances?: EventDistance[];
  mode: "self" | "friend";
}

export default function BookingPageClient({
  isAuthenticated: initialAuth,
  eventId,
  eventTitle,
  eventDate,
  eventEndDate,
  price,
  organizerPaymentInfo,
  spotsLeft,
  distances,
  mode,
}: BookingPageClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuth);

  const handleAuthenticated = () => {
    setAuthenticated(true);
  };

  return (
    <>
      {!authenticated && (
        <AuthBookingModal
          eventName={eventTitle}
          eventId={eventId}
          onAuthenticated={handleAuthenticated}
        />
      )}

      <div className={authenticated ? undefined : "pointer-events-none select-none blur-sm"}>
        <BookingForm
          eventId={eventId}
          eventTitle={eventTitle}
          eventDate={eventDate}
          eventEndDate={eventEndDate}
          price={price}
          organizerPaymentInfo={organizerPaymentInfo}
          spotsLeft={spotsLeft}
          distances={distances}
          mode={mode}
        />
      </div>
    </>
  );
}
