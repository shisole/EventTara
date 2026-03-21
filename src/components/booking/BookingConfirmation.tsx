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

interface RentalConfirmation {
  name: string;
  quantity: number;
  unit_price: number;
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
  paymentPaused?: boolean;
  contactUrl?: string | null;
  clubSlug?: string | null;
  rentalItems?: RentalConfirmation[];
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
  paymentPaused,
  contactUrl,
  clubSlug,
  rentalItems,
}: BookingConfirmationProps) {
  const isPendingEwallet =
    paymentStatus === "pending" && paymentMethod !== "cash" && !paymentPaused;
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
      {paymentPaused ? (
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
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-1">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Contact the organizer directly to arrange payment.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You&apos;ll receive your QR code once payment is verified.
            </p>
          </div>
          {contactUrl ? (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-6 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Contact Organizer
            </a>
          ) : (
            clubSlug && (
              <Link
                href={`/clubs/${clubSlug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Visit the club page for contact details
              </Link>
            )
          )}
          {companions.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-medium mb-2">Companions registered:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {companions.map((c, i) => (
                  <li key={i}>{c.full_name}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : isPendingEwallet ? (
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

      {/* Rental items summary */}
      {rentalItems && rentalItems.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left">
          <p className="text-sm font-medium mb-2">Rental add-ons:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {rentalItems.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {r.name} {r.quantity > 1 ? `×${r.quantity}` : ""}
                </span>
                <span>₱{(r.unit_price * r.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-between text-sm font-medium">
            <span>Rental subtotal</span>
            <span>
              ₱{rentalItems.reduce((t, r) => t + r.unit_price * r.quantity, 0).toLocaleString()}
            </span>
          </div>
        </div>
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
