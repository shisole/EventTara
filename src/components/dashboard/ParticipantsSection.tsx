"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ParticipantsTable from "@/components/dashboard/ParticipantsTable";

const AddParticipantModal = dynamic(() => import("@/components/dashboard/AddParticipantModal"));

interface EventDistance {
  id: string;
  label: string | null;
  distance_km: number;
  price: number;
}

interface ParticipantsSectionProps {
  eventId: string;
  bookings: any[];
  companionsByBooking: Record<string, any[]>;
  checkedInUserIds: Set<string>;
  distances: EventDistance[];
}

export default function ParticipantsSection({
  eventId,
  bookings,
  companionsByBooking,
  checkedInUserIds,
  distances,
}: ParticipantsSectionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <ParticipantsTable
        bookings={bookings}
        companionsByBooking={companionsByBooking}
        checkedInUserIds={checkedInUserIds}
        eventId={eventId}
        onAddParticipant={() => setShowModal(true)}
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
