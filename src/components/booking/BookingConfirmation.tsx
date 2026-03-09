"use client";

import confetti from "canvas-confetti";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";
import { formatEventDate } from "@/lib/utils/format-date";

interface CompanionConfirmation {
  full_name: string;
  qr_code: string | null;
}

interface BookingConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string | null;
  qrCode: string | null;
  paymentStatus?: string;
  paymentMethod?: string;
  companions?: CompanionConfirmation[];
  mode?: "self" | "friend";
}

export default function BookingConfirmation({
  bookingId,
  eventTitle,
  eventDate,
  eventEndDate,
  qrCode,
  paymentStatus,
  paymentMethod,
  companions = [],
  mode = "self",
}: BookingConfirmationProps) {
  const isPendingEwallet = paymentStatus === "pending" && paymentMethod !== "cash";
  const isPendingCash = paymentStatus === "pending" && paymentMethod === "cash";
  const isFriendMode = mode === "friend";
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      void confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"],
      });
      void confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    void confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"],
    });

    // Continuous side cannons
    requestAnimationFrame(frame);
  }, []);

  const companionQRSection = companions.length > 0 && (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-lg">Companion QR Codes</h3>
      <div className="grid gap-4">
        {companions.map((c, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-4 inline-block"
          >
            <p className="font-medium text-sm mb-2">{c.full_name}</p>
            {c.qr_code ? (
              <>
                <QRCodeSVG value={c.qr_code} size={160} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Show at check-in</p>
              </>
            ) : (
              <p className="text-xs text-gray-400">QR code pending</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="text-center space-y-6">
      {isPendingEwallet ? (
        <>
          <div className="text-5xl">{isFriendMode ? "👥" : "✉️"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "Proof Submitted!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode ? (
              <>
                Payment proof for your companions at{" "}
                <span className="font-semibold">{eventTitle}</span> has been submitted. The club
                admin will verify it shortly.
              </>
            ) : (
              <>
                Your payment proof for <span className="font-semibold">{eventTitle}</span> has been
                submitted. The club admin will verify it shortly.
              </>
            )}
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You&apos;ll receive a confirmation email and QR code once your payment is verified.
            </p>
          </div>
          {companions.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-medium mb-2">Companions registered:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {companions.map((c, i) => (
                  <li key={i}>{c.full_name}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                QR codes will be available after payment verification.
              </p>
            </div>
          )}
        </>
      ) : isPendingCash ? (
        <>
          <div className="text-5xl">{isFriendMode ? "👥" : "🎉"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "Spot Reserved!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode ? (
              <>
                Spots for your companions at <span className="font-semibold">{eventTitle}</span> are
                reserved.
              </>
            ) : (
              <>
                Your spot for <span className="font-semibold">{eventTitle}</span> is reserved.
              </>
            )}
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💵 Remember to bring cash on the event day to complete payment.
            </p>
          </div>
          {!isFriendMode && qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Your QR Code
              </p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Show this QR code at check-in
              </p>
            </div>
          )}
          {companionQRSection}
        </>
      ) : (
        <>
          <div className="text-5xl">{isFriendMode ? "👥" : "🎉"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "You\u0027re In!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode ? (
              <>
                Spots for your companions at <span className="font-semibold">{eventTitle}</span> are
                confirmed.
              </>
            ) : (
              <>
                Your spot for <span className="font-semibold">{eventTitle}</span> is confirmed.
              </>
            )}
          </p>
          {!isFriendMode && qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Your QR Code
              </p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Show this QR code at check-in
              </p>
            </div>
          )}
          {companionQRSection}
        </>
      )}

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>📅 {formatEventDate(eventDate, eventEndDate, { includeYear: true })}</p>
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
