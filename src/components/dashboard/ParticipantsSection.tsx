"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import ParticipantsTable, {
  type Booking,
  type Companion,
} from "@/components/dashboard/ParticipantsTable";
import { Download, PrinterIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/export-csv";

const AddParticipantModal = dynamic(() => import("@/components/dashboard/AddParticipantModal"));

interface EventDistance {
  id: string;
  label: string | null;
  distance_km: number;
  price: number;
}

interface ParticipantsSectionProps {
  eventId: string;
  eventStatus: string;
  isFull: boolean;
  bookings: Booking[];
  companionsByBooking: Record<string, Companion[]>;
  checkedInUserIds: Set<string>;
  distances: EventDistance[];
  offlineParticipants: number;
  maxParticipants: number;
}

export default function ParticipantsSection({
  eventId,
  eventStatus,
  isFull,
  bookings,
  companionsByBooking,
  checkedInUserIds,
  distances,
  offlineParticipants,
  maxParticipants,
}: ParticipantsSectionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const isCompleted = eventStatus === "completed";

  // Offline/reserved slots
  const [offlineSlots, setOfflineSlots] = useState(offlineParticipants);
  const [savingOffline, setSavingOffline] = useState(false);
  const offlineDirty = offlineSlots !== offlineParticipants;

  const saveOfflineSlots = useCallback(async () => {
    setSavingOffline(true);
    try {
      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offline_participants: offlineSlots }),
      });
      router.refresh();
    } finally {
      setSavingOffline(false);
    }
  }, [eventId, offlineSlots, router]);

  function handleOfflineChange(value: number) {
    const clamped = Math.min(Math.max(0, value), maxParticipants);
    setOfflineSlots(clamped);
  }

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Name",
      "Email/Contact",
      "Status",
      "Payment Status",
      "Check-in",
      "Waiver Signed",
      "Participant Notes",
      "Organizer Notes",
      "Booked Date",
    ];

    const rows = bookings.map((booking) => {
      const name: string = booking.users?.full_name || booking.manual_name || "Guest";
      const email: string = booking.users?.email || booking.manual_contact || "";
      const status: string = booking.participant_cancelled ? "Cancelled" : booking.status;
      const payment: string = booking.added_by
        ? booking.manual_status || ""
        : booking.payment_status;
      const checkedIn: string = booking.user_id
        ? checkedInUserIds.has(booking.user_id)
          ? "Yes"
          : "No"
        : "";
      const waiver: string = booking.waiver_accepted_at ? "Yes" : "No";
      const participantNotes: string = booking.participant_notes || "";
      const organizerNotes: string = booking.organizer_notes || "";
      const bookedDate: string = new Date(booking.booked_at).toLocaleDateString("en-PH");

      return [
        name,
        email,
        status,
        payment,
        checkedIn,
        waiver,
        participantNotes,
        organizerNotes,
        bookedDate,
      ];
    });

    downloadCSV("participants.csv", headers, rows);
  }, [bookings, checkedInUserIds]);

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" onClick={handleExportCSV} className="gap-1.5 text-sm">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Link href={`/dashboard/events/${eventId}/print`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-1.5 text-sm">
            <PrinterIcon className="h-4 w-4" />
            Print View
          </Button>
        </Link>
      </div>

      {/* Offline / reserved slots */}
      {!isCompleted && (
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="offlineSlots"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Reserved Slots (offline)
            </label>
            <input
              id="offlineSlots"
              type="number"
              min={0}
              max={maxParticipants}
              value={offlineSlots}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleOfflineChange(Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
            />
            {offlineDirty && (
              <Button
                variant="primary"
                onClick={saveOfflineSlots}
                disabled={savingOffline}
                className="px-3 py-1.5 text-xs"
              >
                {savingOffline ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Participants registered or paid outside the platform. Counts toward capacity.
          </p>
        </div>
      )}

      <ParticipantsTable
        bookings={bookings}
        companionsByBooking={companionsByBooking}
        checkedInUserIds={checkedInUserIds}
        eventId={eventId}
        eventStatus={eventStatus}
        isFull={isFull}
        onAddParticipant={isCompleted ? undefined : () => setShowModal(true)}
      />
      {showModal && (
        <AddParticipantModal
          eventId={eventId}
          distances={distances}
          onClose={() => setShowModal(false)}
          onAdded={() => router.refresh()}
        />
      )}
    </>
  );
}
