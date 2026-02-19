"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Card, UIBadge, Button } from "@/components/ui";

interface Booking {
  id: string;
  qrCode: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  eventId: string;
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking", mtb: "Mountain Biking", road_bike: "Road Biking",
  running: "Running", trail_run: "Trail Running",
};

export default function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🗓️</p>
        <p className="text-gray-500 mb-4">No upcoming events.</p>
        <Link href="/events"><Button>Browse Events</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <Card key={b.id} className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <UIBadge variant={b.eventType as any}>{typeLabels[b.eventType] || b.eventType}</UIBadge>
              <Link href={`/events/${b.eventId}`}>
                <h3 className="font-heading font-bold text-lg hover:text-coral-500">{b.eventTitle}</h3>
              </Link>
              <p className="text-sm text-gray-500">
                📅 {new Date(b.eventDate).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-sm text-gray-500">📍 {b.eventLocation}</p>
            </div>
            <button
              onClick={() => setExpandedQR(expandedQR === b.id ? null : b.id)}
              className="text-sm text-coral-500 font-medium hover:text-coral-600"
            >
              {expandedQR === b.id ? "Hide QR" : "Show QR"}
            </button>
          </div>
          {expandedQR === b.id && (
            <div className="mt-4 flex justify-center">
              <div className="bg-white p-4 rounded-xl border">
                <QRCodeSVG value={b.qrCode} size={160} />
                <p className="text-xs text-gray-400 text-center mt-2">Show at check-in</p>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
