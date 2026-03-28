"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { type RentalItem } from "@/components/rentals/RentalItemCard";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

import BookingConfirmation from "./BookingConfirmation";
import CompanionFields, { type Companion } from "./CompanionFields";
import PaymentInstructions from "./PaymentInstructions";
import PaymentMethodPicker from "./PaymentMethodPicker";
import PaymentProofUpload from "./PaymentProofUpload";
import RentalSelectionStep, { type SelectedRental } from "./RentalSelectionStep";

const WaiverModal = dynamic(() => import("./WaiverModal"));

export interface EventDistance {
  id: string;
  distance_km: number;
  label: string | null;
  price: number;
  max_participants: number;
  spots_left: number;
}

interface ClubRentals {
  club: { id: string; name: string; slug: string; logo_url: string | null };
  items: RentalItem[];
}

export interface AvailableRentals {
  own_club: ClubRentals;
  nearby_clubs: ClubRentals[];
}

interface BookingFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string | null;
  price: number;
  paymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft?: number;
  distances?: EventDistance[];
  mode?: "self" | "friend";
  waiverText?: string | null;
  paymentPaused?: boolean;
  contactUrl?: string | null;
  clubSlug?: string | null;
  availableRentals?: AvailableRentals | null;
}

export default function BookingForm({
  eventId,
  eventTitle,
  eventDate,
  eventEndDate,
  price,
  paymentInfo,
  spotsLeft = 999,
  distances,
  mode = "self",
  waiverText,
  paymentPaused,
  contactUrl,
  clubSlug,
  availableRentals,
}: BookingFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRentals, setSelectedRentals] = useState<SelectedRental[]>([]);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [booking, setBooking] = useState<{
    id: string;
    qr_code: string | null;
    payment_status: string;
    payment_method: string | null;
    expires_at: string | null;
    payment_proof_url: string | null;
    companions?: { id: string; full_name: string; qr_code: string | null }[];
  } | null>(null);
  const [companions, setCompanions] = useState<Companion[]>(
    mode === "friend" ? [{ full_name: "", phone: "" }] : [],
  );
  const [selectedDistanceId, setSelectedDistanceId] = useState<string>("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);

  const hasWaiver = !!waiverText;

  const hasDistances = distances && distances.length > 0;
  const selectedDistance = hasDistances
    ? distances.find((d) => d.id === selectedDistanceId)
    : undefined;

  // Use selected distance's price and spots if distances exist, otherwise fall back to event-level
  const effectivePrice = selectedDistance ? selectedDistance.price : price;
  const effectiveSpotsLeft = selectedDistance ? selectedDistance.spots_left : spotsLeft;

  const isFree = effectivePrice === 0;
  const isEwallet = paymentMethod === "gcash" || paymentMethod === "maya";
  const isCash = paymentMethod === "cash";

  // In self mode: 1 spot for user + companions. In friend mode: only companions.
  const selfSlots = mode === "self" ? 1 : 0;
  const totalPeople = selfSlots + companions.length;

  // When distances exist, max companions is the total remaining spots across all distances
  const maxCompanions = hasDistances
    ? Math.max(0, distances.reduce((sum, d) => sum + Math.max(0, d.spots_left), 0) - selfSlots)
    : Math.max(0, effectiveSpotsLeft - selfSlots);

  // Calculate total price: booker's distance price + each companion's distance price
  const companionPriceTotal = hasDistances
    ? companions.reduce((sum, c) => {
        const d = distances.find((dist) => dist.id === c.event_distance_id);
        return sum + (d ? d.price : 0);
      }, 0)
    : effectivePrice * companions.length;
  const totalPrice = effectivePrice * selfSlots + companionPriceTotal;

  // Rental availability check
  const hasRentals =
    availableRentals &&
    (availableRentals.own_club.items.length > 0 ||
      availableRentals.nearby_clubs.some((c) => c.items.length > 0));

  // Compute rental subtotal
  const allRentalItems = availableRentals
    ? [...availableRentals.own_club.items, ...availableRentals.nearby_clubs.flatMap((c) => c.items)]
    : [];
  const rentalSubtotal = selectedRentals.reduce((total, sel) => {
    const item = allRentalItems.find((i) => i.id === sel.rental_item_id);
    return total + (item ? item.rental_price * sel.quantity : 0);
  }, 0);

  const grandTotal = totalPrice + rentalSubtotal;

  const handleProceedToStep2 = () => {
    // Validate step 1 before proceeding
    if (hasDistances && mode === "self" && !selectedDistanceId) {
      setError("Please select a distance category");
      return;
    }
    if (mode === "friend" && companions.length === 0) {
      setError("Please add at least one companion");
      return;
    }
    const invalidCompanion = companions.find((c) => !c.full_name.trim());
    if (invalidCompanion) {
      setError("Please fill in all companion names");
      return;
    }
    if (hasDistances && companions.some((c) => !c.event_distance_id)) {
      setError("Please select a distance for each companion");
      return;
    }
    setError("");
    setBookingStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasDistances && mode === "self" && !selectedDistanceId) {
      setError("Please select a distance category");
      return;
    }

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

    // Validate companion distances when event has distances
    if (hasDistances && companions.some((c) => !c.event_distance_id)) {
      setError("Please select a distance for each companion");
      return;
    }

    if (hasWaiver && !waiverAccepted) {
      setError("Please read and accept the waiver to continue");
      return;
    }

    if (!paymentPaused && !isFree && !paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    // Proof is optional at booking time — user can upload within 30 min

    setLoading(true);
    setError("");

    try {
      let res: Response;
      const companionData = companions.map((c) => ({
        full_name: c.full_name.trim(),
        phone: c.phone.trim() || null,
        event_distance_id: c.event_distance_id || null,
      }));

      const rentalPayload =
        selectedRentals.length > 0
          ? selectedRentals.map((r) => ({
              rental_item_id: r.rental_item_id,
              quantity: r.quantity,
              size: r.size,
            }))
          : undefined;

      if (paymentPaused) {
        res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            payment_method: null,
            mode,
            event_distance_id: selectedDistanceId || undefined,
            companions: companionData.length > 0 ? companionData : undefined,
            participant_notes: participantNotes.trim() || null,
            waiver_accepted_at: waiverAccepted ? new Date().toISOString() : null,
            rental_items: rentalPayload,
          }),
        });
      } else if (isEwallet && proofFile) {
        const formData = new FormData();
        formData.append("event_id", eventId);
        formData.append("payment_method", paymentMethod);
        formData.append("payment_proof", proofFile);
        formData.append("mode", mode);
        if (selectedDistanceId) {
          formData.append("event_distance_id", selectedDistanceId);
        }
        if (companionData.length > 0) {
          formData.append("companions", JSON.stringify(companionData));
        }
        if (participantNotes.trim()) {
          formData.append("participant_notes", participantNotes.trim());
        }
        if (waiverAccepted) {
          formData.append("waiver_accepted_at", new Date().toISOString());
        }
        if (rentalPayload) {
          formData.append("rental_items", JSON.stringify(rentalPayload));
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
            event_distance_id: selectedDistanceId || undefined,
            companions: companionData.length > 0 ? companionData : undefined,
            participant_notes: participantNotes.trim() || null,
            waiver_accepted_at: waiverAccepted ? new Date().toISOString() : null,
            rental_items: rentalPayload,
          }),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setBooking({ ...data.booking, companions: data.companions });
      } else {
        setError(data.error);
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
        eventEndDate={eventEndDate}
        qrCode={booking.qr_code}
        paymentStatus={booking.payment_status}
        paymentMethod={booking.payment_method ?? undefined}
        companions={booking.companions}
        mode={mode}
        paymentPaused={paymentPaused}
        contactUrl={contactUrl}
        clubSlug={clubSlug}
        rentalItems={
          selectedRentals.length > 0
            ? selectedRentals.map((r) => {
                const item = allRentalItems.find((i) => i.id === r.rental_item_id);
                return {
                  name: item?.name ?? "Rental item",
                  quantity: r.quantity,
                  unit_price: item?.rental_price ?? 0,
                };
              })
            : undefined
        }
        expiresAt={booking.expires_at}
        hasProof={!!booking.payment_proof_url}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={loading} className="min-w-0 space-y-6">
        {/* Progress indicator */}
        {(() => {
          const steps = [
            { label: "Event", done: true },
            ...(hasDistances && mode === "self"
              ? [{ label: "Distance", done: !!selectedDistanceId }]
              : []),
            ...(paymentPaused || isFree ? [] : [{ label: "Payment", done: !!paymentMethod }]),
            ...(hasWaiver ? [{ label: "Waiver", done: waiverAccepted }] : []),
          ];
          const completed = steps.filter((s) => s.done).length;
          const pct = Math.round((completed / steps.length) * 100);
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {completed}/{steps.length} completed
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-500 transition-all duration-300"
                  style={{ width: `${String(pct)}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="font-heading font-bold">{eventTitle}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatEventDate(eventDate, eventEndDate)}
          </p>
          {!hasDistances && (
            <p className="text-lg font-bold text-lime-600 dark:text-lime-400 mt-2">
              {isFree
                ? "Free"
                : totalPeople > 1
                  ? `₱${effectivePrice.toLocaleString()} × ${totalPeople} = ₱${totalPrice.toLocaleString()}`
                  : `₱${effectivePrice.toLocaleString()}`}
            </p>
          )}
        </div>

        {hasDistances && mode === "self" && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Distance
            </label>
            <div className="grid gap-3">
              {distances.map((d) => {
                const isSelected = selectedDistanceId === d.id;
                const isSoldOut = d.spots_left <= 0;
                const displayLabel = d.label || `${d.distance_km} km`;

                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => {
                      setSelectedDistanceId(d.id);
                      setError("");
                    }}
                    className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
                      isSoldOut
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50"
                        : isSelected
                          ? "border-lime-500 bg-lime-50 ring-1 ring-lime-500 dark:border-lime-400 dark:bg-lime-950/30 dark:ring-lime-400"
                          : "cursor-pointer border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? "border-lime-500 bg-lime-500 dark:border-lime-400 dark:bg-lime-400"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="h-3 w-3 text-white dark:text-gray-900"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="font-heading font-bold text-gray-900 dark:text-gray-100">
                            {displayLabel}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {d.distance_km} km
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lime-600 dark:text-lime-400">
                          {d.price === 0 ? "Free" : `₱${d.price.toLocaleString()}`}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {isSoldOut ? (
                            <span className="text-red-500 dark:text-red-400 font-medium">
                              Sold out
                            </span>
                          ) : (
                            `${d.spots_left} spot${d.spots_left === 1 ? "" : "s"} left`
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDistance && (
              <div className="rounded-xl bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800 p-3">
                <p className="text-lg font-bold text-lime-600 dark:text-lime-400">
                  {isFree
                    ? "Free"
                    : totalPrice > 0
                      ? `₱${totalPrice.toLocaleString()}`
                      : `₱${effectivePrice.toLocaleString()}`}
                </p>
              </div>
            )}
          </div>
        )}

        {mode === "self" && (
          <CompanionFields
            companions={companions}
            onChange={setCompanions}
            maxCompanions={maxCompanions}
            distances={hasDistances ? distances : undefined}
          />
        )}

        {mode === "friend" && (
          <CompanionFields
            companions={companions}
            onChange={setCompanions}
            maxCompanions={maxCompanions}
            distances={hasDistances ? distances : undefined}
          />
        )}

        {paymentPaused ? (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                Online payments are not yet available for this event.
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Reserve your spot now and contact the organizer directly to arrange payment.
              </p>
            </div>
            {contactUrl ? (
              <a
                href={contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
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
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Visit the club page for contact details
                </Link>
              )
            )}
          </div>
        ) : (
          <>
            {!isFree && (
              <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />
            )}

            {isEwallet && paymentInfo && (
              <PaymentInstructions
                method={paymentMethod}
                paymentInfo={paymentInfo}
                amount={totalPrice}
              />
            )}

            {isEwallet && <PaymentProofUpload file={proofFile} onFileChange={setProofFile} />}

            {isCash && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You&apos;ll pay <strong>₱{totalPrice.toLocaleString()}</strong> in cash on the
                  event day. Your spot will be reserved.
                </p>
              </div>
            )}
          </>
        )}

        {/* Participant Notes */}
        <div className="space-y-2">
          <label
            htmlFor="participant-notes"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Notes / special requests{" "}
            <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            id="participant-notes"
            value={participantNotes}
            onChange={(e) => setParticipantNotes(e.target.value)}
            placeholder="Medical conditions, dietary needs, or special requests..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-lime-400 dark:focus:ring-lime-400"
          />
        </div>

        {/* Waiver */}
        {hasWaiver && (
          <div className="space-y-3">
            {waiverAccepted ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
                <svg
                  className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Waiver accepted
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowWaiver(true)}
                  className="w-full rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/50"
                >
                  View & Accept Waiver
                </button>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You must read and accept the event waiver before booking.
                </p>
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Step 2: Rental selection */}
        {bookingStep === 2 && hasRentals && availableRentals && (
          <RentalSelectionStep
            ownClub={availableRentals.own_club}
            nearbyClubs={availableRentals.nearby_clubs}
            selections={selectedRentals}
            onSelectionsChange={setSelectedRentals}
          />
        )}

        {/* Grand total with rentals */}
        {bookingStep === 2 && rentalSubtotal > 0 && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Event booking</span>
              <span>₱{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span>Rental add-ons</span>
              <span>₱{rentalSubtotal.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-lg font-bold text-lime-600 dark:text-lime-400">
                ₱{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {bookingStep === 1 && hasRentals ? (
          <Button
            type="button"
            className={cn(
              "w-full",
              hasWaiver && !waiverAccepted && "cursor-not-allowed opacity-50",
            )}
            size="lg"
            disabled={hasWaiver && !waiverAccepted}
            onClick={handleProceedToStep2}
          >
            Continue to Rental Add-ons
          </Button>
        ) : bookingStep === 2 ? (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setBookingStep(1);
                setError("");
              }}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" size="lg" disabled={loading}>
              {loading
                ? "Booking..."
                : paymentPaused
                  ? "Reserve Spot"
                  : isFree
                    ? "Confirm Booking"
                    : isCash
                      ? "Reserve Spot"
                      : isEwallet
                        ? proofFile
                          ? "Submit Booking & Proof"
                          : "Book Now"
                        : "Confirm Booking"}
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            className={cn(
              "w-full",
              hasWaiver && !waiverAccepted && "cursor-not-allowed opacity-50",
            )}
            size="lg"
            disabled={loading || (hasWaiver && !waiverAccepted)}
          >
            {loading
              ? "Booking..."
              : paymentPaused
                ? "Reserve Spot"
                : isFree
                  ? "Confirm Booking"
                  : isCash
                    ? "Reserve Spot"
                    : isEwallet
                      ? proofFile
                        ? "Submit Booking & Proof"
                        : "Book Now"
                      : "Confirm Booking"}
          </Button>
        )}

        {/* Waiver Modal */}
        {showWaiver && waiverText && (
          <WaiverModal
            waiverHtml={waiverText}
            onAccept={() => {
              setWaiverAccepted(true);
              setShowWaiver(false);
            }}
            onClose={() => setShowWaiver(false)}
          />
        )}
      </fieldset>
    </form>
  );
}
