"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import { Button } from "@/components/ui";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";

interface Booking {
  id: string;
  status: string;
  payment_status: "pending" | "paid" | "rejected" | "refunded";
  payment_method: string | null;
  participant_cancelled: boolean;
  booked_at: string;
  users: { full_name: string; email: string; avatar_url: string | null } | null;
}

interface Companion {
  id: string;
  full_name: string;
  status: "pending" | "confirmed" | "cancelled";
}

interface ParticipantsTableProps {
  bookings: Booking[];
  companionsByBooking: Record<string, Companion[]>;
}

const companionStatusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  confirmed: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 line-through",
};

export default function ParticipantsTable({
  bookings,
  companionsByBooking,
}: ParticipantsTableProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleBookingAction = async (bookingId: string, action: "approve" | "reject") => {
    setActionLoading(`booking-${bookingId}`);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } catch (error) {
      console.error("Payment action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompanionAction = async (companionId: string, action: "confirm" | "cancel") => {
    setActionLoading(`comp-${companionId}`);
    try {
      const res = await fetch(`/api/companions/${companionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } catch (error) {
      console.error("Companion action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleParticipantCancel = async (bookingId: string, cancel: boolean) => {
    setActionLoading(`participant-${bookingId}`);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/participant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelled: cancel }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } catch (error) {
      console.error("Participant action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!bookings || bookings.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No participants yet.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Name
            </th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Method
            </th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Booked
            </th>
            <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {bookings.map((booking) => {
            const comps = companionsByBooking[booking.id] || [];
            const activeComps = comps.filter((c) => c.status !== "cancelled");
            const isPending = booking.payment_status === "pending";
            const isEwallet =
              booking.payment_method === "gcash" || booking.payment_method === "maya";
            const isCash = booking.payment_method === "cash";
            const isBookingLoading = actionLoading === `booking-${booking.id}`;
            const isParticipantLoading = actionLoading === `participant-${booking.id}`;
            const isBookingPaid = booking.payment_status === "paid";

            return (
              <Fragment key={booking.id}>
                <tr className={booking.participant_cancelled ? "opacity-60" : ""}>
                  <td className="px-6 py-4 font-medium dark:text-white">
                    <span className={booking.participant_cancelled ? "line-through" : ""}>
                      {booking.users?.full_name || "Guest"}
                    </span>
                    {booking.participant_cancelled && (
                      <span className="ml-2 text-xs text-red-500 font-normal">cancelled</span>
                    )}
                    {activeComps.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
                        +{activeComps.length} companion{activeComps.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {booking.users?.email || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={booking.payment_status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {booking.payment_method?.toUpperCase() || "Free"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.booked_at).toLocaleDateString("en-PH")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isPending && (isEwallet || isCash) && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, "approve")}
                            disabled={isBookingLoading}
                          >
                            {isBookingLoading ? "..." : isCash ? "Mark Paid" : "Approve"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, "reject")}
                            disabled={isBookingLoading}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {isBookingPaid && !booking.participant_cancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleParticipantCancel(booking.id, true)}
                          disabled={isParticipantLoading}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          {isParticipantLoading ? "..." : "Cancel"}
                        </Button>
                      )}
                      {isBookingPaid && booking.participant_cancelled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleParticipantCancel(booking.id, false)}
                          disabled={isParticipantLoading}
                        >
                          {isParticipantLoading ? "..." : "Restore"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {comps.map((comp) => {
                  const isCompLoading = actionLoading === `comp-${comp.id}`;
                  return (
                    <tr key={comp.id} className="bg-gray-50/50 dark:bg-gray-800/50">
                      <td className="px-6 py-3 pl-12 text-sm text-gray-600 dark:text-gray-400">
                        ↳ {comp.full_name}{" "}
                        <span className="text-gray-400 dark:text-gray-500">(companion)</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${companionStatusStyle[comp.status] || companionStatusStyle.pending}`}
                        >
                          {comp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                      <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                      <td className="px-6 py-3 text-right">
                        {isBookingPaid && comp.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompanionAction(comp.id, "cancel")}
                            disabled={isCompLoading}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            {isCompLoading ? "..." : "Cancel"}
                          </Button>
                        )}
                        {isBookingPaid && comp.status === "cancelled" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCompanionAction(comp.id, "confirm")}
                            disabled={isCompLoading}
                          >
                            {isCompLoading ? "..." : "Restore"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
