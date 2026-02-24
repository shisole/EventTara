"use client";

import { useState } from "react";

import AuthBookingModal from "./AuthBookingModal";
import BookingForm from "./BookingForm";

interface BookingPageClientProps {
  isAuthenticated: boolean;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  price: number;
  organizerPaymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft: number;
  mode: "self" | "friend";
}

export default function BookingPageClient({
  isAuthenticated: initialAuth,
  eventId,
  eventTitle,
  eventDate,
  price,
  organizerPaymentInfo,
  spotsLeft,
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
          price={price}
          organizerPaymentInfo={organizerPaymentInfo}
          spotsLeft={spotsLeft}
          mode={mode}
        />
      </div>
    </>
  );
}
