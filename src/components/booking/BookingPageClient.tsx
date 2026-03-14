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
  paymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft: number;
  distances?: EventDistance[];
  mode: "self" | "friend";
  waiverText?: string | null;
  paymentPaused?: boolean;
  contactUrl?: string | null;
  clubSlug?: string | null;
}

export default function BookingPageClient({
  isAuthenticated: initialAuth,
  eventId,
  eventTitle,
  eventDate,
  eventEndDate,
  price,
  paymentInfo,
  spotsLeft,
  distances,
  mode,
  waiverText,
  paymentPaused,
  contactUrl,
  clubSlug,
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
          paymentInfo={paymentInfo}
          spotsLeft={spotsLeft}
          distances={distances}
          mode={mode}
          waiverText={waiverText}
          paymentPaused={paymentPaused}
          contactUrl={contactUrl}
          clubSlug={clubSlug}
        />
      </div>
    </>
  );
}
