"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState, useRef } from "react";
import { Card, UIBadge, Button } from "@/components/ui";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";

interface BookingCompanion {
  full_name: string;
  qr_code: string | null;
}

interface Booking {
  id: string;
  qrCode: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  eventId: string;
  eventPrice: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentProofUrl: string | null;
  companions?: BookingCompanion[];
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking", mtb: "Mountain Biking", road_bike: "Road Biking",
  running: "Running", trail_run: "Trail Running",
};

function ReuploadButton({ bookingId }: { bookingId: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("payment_proof", file);

    const res = await fetch(`/api/bookings/${bookingId}/proof`, {
      method: "PATCH",
      body: formData,
    });

    if (res.ok) {
      window.location.reload();
    }
    setUploading(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Re-upload Proof"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </>
  );
}

export default function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🗓️</p>
        <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming events.</p>
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
              <div className="flex gap-2 items-center">
                <UIBadge variant={b.eventType as any}>{typeLabels[b.eventType] || b.eventType}</UIBadge>
                {b.paymentStatus && <PaymentStatusBadge status={b.paymentStatus as any} />}
              </div>
              <Link href={`/events/${b.eventId}`}>
                <h3 className="font-heading font-bold text-lg hover:text-lime-600 dark:hover:text-lime-400">{b.eventTitle}</h3>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📅 {new Date(b.eventDate).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">📍 {b.eventLocation}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {b.eventPrice > 0 ? `₱${b.eventPrice.toLocaleString()}` : "Free"}
              </p>
              {b.paymentStatus === "pending" && b.paymentMethod !== "cash" && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Waiting for payment verification</p>
              )}
              {b.paymentStatus === "pending" && b.paymentMethod === "cash" && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pay cash on event day</p>
              )}
              {b.paymentStatus === "rejected" && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">Payment rejected — please re-upload proof</p>
                  <ReuploadButton bookingId={b.id} />
                </div>
              )}
            </div>
            {b.qrCode && (
              <button
                onClick={() => setExpandedQR(expandedQR === b.id ? null : b.id)}
                className="text-sm text-lime-600 dark:text-lime-400 font-medium hover:text-lime-600"
              >
                {expandedQR === b.id ? "Hide QR" : "Show QR"}
              </button>
            )}
          </div>
          {expandedQR === b.id && b.qrCode && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-center">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">Your QR Code</p>
                  <QRCodeSVG value={b.qrCode} size={160} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Show at check-in</p>
                </div>
              </div>
              {b.companions && b.companions.length > 0 && (
                <div className="space-y-2">
                  {b.companions.map((comp, i) => (
                    <div key={i} className="flex justify-center">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">{comp.full_name}</p>
                        {comp.qr_code ? (
                          <>
                            <QRCodeSVG value={comp.qr_code} size={140} />
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Show at check-in</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 text-center">QR code pending verification</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
