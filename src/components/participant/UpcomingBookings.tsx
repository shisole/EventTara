"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useRef } from "react";

import { Card, UIBadge, Button } from "@/components/ui";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";
import { getActivityLabel } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

const ReviewPromptModal = dynamic(() => import("@/components/reviews/ReviewPromptModal"));

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
  eventEndDate?: string | null;
  eventLocation: string;
  eventId: string;
  eventPrice: number;
  paymentStatus: "pending" | "paid" | "rejected" | "refunded";
  paymentMethod: string;
  paymentProofUrl: string | null;
  companions?: BookingCompanion[];
  checkedIn: boolean;
  userId: string;
  expiresAt?: string | null;
}

function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [status, setStatus] = useState<"idle" | "confirming" | "loading">("idle");

  const handleCancel = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      if (res.ok) {
        globalThis.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel booking");
        setStatus("idle");
      }
    } catch {
      alert("Failed to cancel booking");
      setStatus("idle");
    }
  };

  if (status === "confirming") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 dark:text-red-400">Cancel this booking?</span>
        <Button
          size="sm"
          variant="primary"
          onClick={handleCancel}
          className="!bg-red-600 hover:!bg-red-700 !text-white"
        >
          Yes, Cancel
        </Button>
        <Button size="sm" variant="outline" onClick={() => setStatus("idle")}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setStatus("confirming")}
      disabled={status === "loading"}
      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
    >
      {status === "loading" ? "Cancelling..." : "Cancel Booking"}
    </Button>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsUrgent(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      setIsUrgent(mins < 5);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums text-sm",
        timeLeft === "Expired"
          ? "text-red-600 dark:text-red-400"
          : isUrgent
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400",
      )}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
        />
      </svg>
      {timeLeft}
    </span>
  );
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function ProofUploader({
  bookingId,
  label = "Upload payment screenshot",
}: {
  bookingId: string;
  label?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (f: File) => {
    setError("");
    if (!ACCEPTED_TYPES.has(f.type)) {
      setError("Only JPG, PNG, and WebP images are accepted.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File must be under 5MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("payment_proof", file);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/proof`, {
        method: "PATCH",
        body: formData,
      });
      if (res.ok) {
        globalThis.location.reload();
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const clear = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError("");
  };

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <img
            src={preview}
            alt="Payment proof preview"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
          >
            ✕
          </button>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Submit Proof"}
        </Button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-lime-500 bg-lime-50 dark:bg-lime-950"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
      >
        <p className="text-2xl mb-1">📸</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Drag & drop or tap to browse (JPG, PNG, WebP — max 5MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function CheckInOnlineButton({
  booking,
  onCheckedIn,
}: {
  booking: Booking;
  onCheckedIn?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">(
    booking.checkedIn ? "done" : "idle",
  );

  const eventDate = new Date(booking.eventDate);
  const hoursUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isFree = booking.eventPrice === 0;
  const isPaid = booking.paymentStatus === "paid";

  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-forest-600 dark:text-forest-400">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Checked In
      </span>
    );
  }

  // Not eligible: unpaid non-free, outside 48h window
  if ((!isFree && !isPaid) || hoursUntil > 48 || hoursUntil < -24) {
    return null;
  }

  const handleCheckin = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: booking.eventId, user_id: booking.userId }),
      });
      if (res.ok) {
        setStatus("done");
        onCheckedIn?.();
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  };

  return (
    <Button size="sm" onClick={handleCheckin} disabled={status === "loading"}>
      {status === "loading" ? "Checking in..." : "Check In Online"}
    </Button>
  );
}

export default function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  const [reviewEvent, setReviewEvent] = useState<{
    id: string;
    title: string;
  } | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🗓️</p>
        <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming events.</p>
        <Link href="/events">
          <Button>Browse Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <Card key={b.id} className="p-5 space-y-4">
          {/* Header: event info + QR toggle */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex gap-2 items-center flex-wrap">
                <UIBadge variant={b.eventType}>{getActivityLabel(b.eventType)}</UIBadge>
                {b.paymentStatus && b.paymentMethod && (
                  <PaymentStatusBadge status={b.paymentStatus} />
                )}
              </div>
              <Link href={`/events/${b.eventId}`}>
                <h3 className="font-heading font-bold text-lg hover:text-lime-600 dark:hover:text-lime-400">
                  {b.eventTitle}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📅 {formatEventDate(b.eventDate, b.eventEndDate, { short: true })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">📍 {b.eventLocation}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {b.eventPrice > 0 ? `₱${b.eventPrice.toLocaleString()}` : "Free"}
              </p>
              {b.companions && b.companions.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  👥 {b.companions.length} companion{b.companions.length > 1 ? "s" : ""} booked
                </p>
              )}
            </div>
            {b.qrCode && (
              <button
                onClick={() => {
                  setExpandedQR(expandedQR === b.id ? null : b.id);
                }}
                className="text-sm text-lime-600 dark:text-lime-400 font-medium hover:text-lime-600"
              >
                {expandedQR === b.id ? "Hide QR" : "Show QR"}
              </button>
            )}
          </div>

          {/* Proof upload or expired state */}
          {b.paymentStatus === "pending" &&
            b.paymentMethod !== "cash" &&
            b.paymentMethod !== "free" &&
            !b.paymentProofUrl &&
            (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now() ? (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Booking expired
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  The payment window has closed. This booking will be cancelled automatically. You
                  can re-book the event if spots are still available.
                </p>
                <Link href={`/events/${b.eventId}`}>
                  <Button size="sm" variant="outline" className="mt-1">
                    View Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Upload proof to keep your booking
                  </p>
                  {b.expiresAt && <CountdownTimer expiresAt={b.expiresAt} />}
                </div>
                {b.expiresAt && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your booking will be automatically cancelled when the timer expires.
                  </p>
                )}
                <ProofUploader bookingId={b.id} />
              </div>
            ))}

          {/* D: Proof uploaded — waiting for verification */}
          {b.paymentStatus === "pending" &&
            b.paymentMethod !== "cash" &&
            b.paymentMethod !== "free" &&
            b.paymentProofUrl && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Proof submitted — waiting for admin verification
                </p>
              </div>
            )}

          {b.paymentStatus === "pending" && b.paymentMethod === "cash" && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">💵 Pay cash on event day</p>
          )}

          {b.paymentStatus === "rejected" && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Payment rejected — please re-upload proof
              </p>
              <ProofUploader bookingId={b.id} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <CheckInOnlineButton
              booking={b}
              onCheckedIn={() => {
                setReviewEvent({ id: b.eventId, title: b.eventTitle });
              }}
            />
          </div>

          {/* C: Cancel button — separated at bottom, subdued */}
          {!b.checkedIn && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <CancelBookingButton bookingId={b.id} />
            </div>
          )}
          {expandedQR === b.id && b.qrCode && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-center">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">
                    Your QR Code
                  </p>
                  <QRCodeSVG value={b.qrCode} size={160} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                    Show at check-in
                  </p>
                </div>
              </div>
              {b.companions && b.companions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                    Companions (booked for friends)
                  </p>
                  {b.companions.map((comp, i) => (
                    <div key={i} className="flex justify-center">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">
                          👤 {comp.full_name}
                        </p>
                        {comp.qr_code ? (
                          <>
                            <QRCodeSVG value={comp.qr_code} size={140} />
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                              Show at check-in
                            </p>
                          </>
                        ) : b.eventPrice === 0 ? (
                          <p className="text-xs text-lime-600 dark:text-lime-400 text-center">
                            Confirmed
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 text-center">
                            QR code pending verification
                          </p>
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

      {reviewEvent && (
        <ReviewPromptModal
          eventId={reviewEvent.id}
          eventTitle={reviewEvent.title}
          onClose={() => {
            setReviewEvent(null);
          }}
        />
      )}
    </div>
  );
}
