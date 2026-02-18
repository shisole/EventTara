"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface BookingConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  qrCode: string;
}

export default function BookingConfirmation({
  bookingId, eventTitle, eventDate, qrCode,
}: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-6">
      <div className="text-5xl">{"\u{1F389}"}</div>
      <h2 className="text-2xl font-heading font-bold">You&apos;re In!</h2>
      <p className="text-gray-600">Your spot for <span className="font-semibold">{eventTitle}</span> is confirmed.</p>

      <div className="bg-white rounded-2xl shadow-md p-6 inline-block">
        <QRCodeSVG value={qrCode} size={200} />
        <p className="text-xs text-gray-400 mt-3">Show this QR code at check-in</p>
      </div>

      <div className="text-sm text-gray-500">
        <p>{"\u{1F4C5}"} {new Date(eventDate).toLocaleDateString("en-PH", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        })}</p>
        <p className="text-xs mt-1">Booking ID: {bookingId}</p>
      </div>

      <div className="flex gap-3 justify-center">
        <Link href="/my-events">
          <Button variant="primary">View My Events</Button>
        </Link>
        <Link href="/events">
          <Button variant="outline">Browse More Events</Button>
        </Link>
      </div>
    </div>
  );
}
