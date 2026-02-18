"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import PaymentMethodPicker from "./PaymentMethodPicker";
import BookingConfirmation from "./BookingConfirmation";

interface BookingFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  price: number;
}

export default function BookingForm({ eventId, eventTitle, eventDate, price }: BookingFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod && price > 0) {
      setError("Please select a payment method");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        payment_method: price === 0 ? "free" : paymentMethod,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
    } else {
      setBooking(data.booking);
    }
  };

  if (booking) {
    return (
      <BookingConfirmation
        bookingId={booking.id}
        eventTitle={eventTitle}
        eventDate={eventDate}
        qrCode={booking.qr_code}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-heading font-bold">{eventTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(eventDate).toLocaleDateString("en-PH", {
            weekday: "long", month: "long", day: "numeric",
          })}
        </p>
        <p className="text-lg font-bold text-coral-500 mt-2">
          {price === 0 ? "Free" : `\u20B1${price.toLocaleString()}`}
        </p>
      </div>

      {price > 0 && (
        <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Booking..." : "Confirm Booking"}
      </Button>
    </form>
  );
}
