"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import PaymentMethodPicker from "./PaymentMethodPicker";
import PaymentInstructions from "./PaymentInstructions";
import PaymentProofUpload from "./PaymentProofUpload";
import BookingConfirmation from "./BookingConfirmation";
import CompanionFields, { type Companion } from "./CompanionFields";

interface BookingFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  price: number;
  organizerPaymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft?: number;
  mode?: "self" | "friend";
}

export default function BookingForm({
  eventId, eventTitle, eventDate, price, organizerPaymentInfo,
  spotsLeft = 999, mode = "self",
}: BookingFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [companions, setCompanions] = useState<Companion[]>(
    mode === "friend" ? [{ full_name: "", phone: "" }] : []
  );

  const isFree = price === 0;
  const isEwallet = paymentMethod === "gcash" || paymentMethod === "maya";
  const isCash = paymentMethod === "cash";

  // In self mode: 1 spot for user + companions. In friend mode: only companions.
  const selfSlots = mode === "self" ? 1 : 0;
  const totalPeople = selfSlots + companions.length;
  const maxCompanions = Math.max(0, spotsLeft - selfSlots);
  const totalPrice = price * totalPeople;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "friend" && companions.length === 0) {
      setError("Please add at least one companion");
      return;
    }

    // Validate companion names
    const invalidCompanion = companions.find((c) => !c.full_name.trim());
    if (invalidCompanion) {
      setError("Please fill in all companion names");
      return;
    }

    if (!isFree && !paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    if (isEwallet && !proofFile) {
      setError("Please upload your payment screenshot");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let res: Response;
      const companionData = companions.map((c) => ({
        full_name: c.full_name.trim(),
        phone: c.phone.trim() || null,
      }));

      if (isEwallet && proofFile) {
        const formData = new FormData();
        formData.append("event_id", eventId);
        formData.append("payment_method", paymentMethod);
        formData.append("payment_proof", proofFile);
        formData.append("mode", mode);
        if (companionData.length > 0) {
          formData.append("companions", JSON.stringify(companionData));
        }

        res = await fetch("/api/bookings", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            payment_method: isFree ? "free" : paymentMethod,
            mode,
            companions: companionData.length > 0 ? companionData : undefined,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setBooking({ ...data.booking, companions: data.companions });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (booking) {
    return (
      <BookingConfirmation
        bookingId={booking.id}
        eventTitle={eventTitle}
        eventDate={eventDate}
        qrCode={booking.qr_code}
        paymentStatus={booking.payment_status}
        paymentMethod={booking.payment_method}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h3 className="font-heading font-bold">{eventTitle}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date(eventDate).toLocaleDateString("en-PH", {
            weekday: "long", month: "long", day: "numeric",
          })}
        </p>
        <p className="text-lg font-bold text-lime-600 dark:text-lime-400 mt-2">
          {isFree ? "Free" : totalPeople > 1
            ? `₱${price.toLocaleString()} × ${totalPeople} = ₱${totalPrice.toLocaleString()}`
            : `₱${price.toLocaleString()}`}
        </p>
      </div>

      {mode === "self" && (
        <CompanionFields
          companions={companions}
          onChange={setCompanions}
          maxCompanions={maxCompanions}
        />
      )}

      {mode === "friend" && (
        <CompanionFields
          companions={companions}
          onChange={setCompanions}
          maxCompanions={maxCompanions}
        />
      )}

      {!isFree && (
        <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />
      )}

      {isEwallet && organizerPaymentInfo && (
        <PaymentInstructions
          method={paymentMethod as "gcash" | "maya"}
          paymentInfo={organizerPaymentInfo}
          amount={totalPrice}
        />
      )}

      {isEwallet && (
        <PaymentProofUpload file={proofFile} onFileChange={setProofFile} />
      )}

      {isCash && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💵 You&apos;ll pay <strong>₱{totalPrice.toLocaleString()}</strong> in cash on the event day. Your spot will be reserved.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Booking..." : isFree ? "Confirm Booking" : isCash ? "Reserve Spot" : isEwallet ? "Submit Booking & Proof" : "Confirm Booking"}
      </Button>
    </form>
  );
}
