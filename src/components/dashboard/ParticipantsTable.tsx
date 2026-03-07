"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  user_id: string | null;
  status: string;
  payment_status: "pending" | "paid" | "rejected" | "refunded";
  payment_method: string | null;
  participant_cancelled: boolean;
  booked_at: string;
  added_by: string | null;
  manual_status: "paid" | "reserved" | "pending" | null;
  manual_name: string | null;
  manual_contact: string | null;
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
  checkedInUserIds?: Set<string>;
  eventId: string;
  eventStatus?: string;
  isFull?: boolean;
  onAddParticipant?: () => void;
}

type PaymentFilter = "all" | "pending" | "paid" | "rejected" | "refunded";
type CheckInFilter = "all" | "checked_in" | "not_checked_in";

const PAYMENT_FILTERS: { label: string; value: PaymentFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Rejected", value: "rejected" },
  { label: "Refunded", value: "refunded" },
];

const CHECKIN_FILTERS: { label: string; value: CheckInFilter }[] = [
  { label: "All", value: "all" },
  { label: "Checked in", value: "checked_in" },
  { label: "Not checked in", value: "not_checked_in" },
];

const companionStatusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  confirmed: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 line-through",
};

const manualStatusStyle: Record<string, string> = {
  paid: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  reserved: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

function ManualStatusBadge({ status }: { status: "paid" | "reserved" | "pending" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize",
        manualStatusStyle[status],
      )}
    >
      {status}
    </span>
  );
}

function ManualStatusDropdown({
  bookingId,
  eventId,
  currentStatus,
  onUpdated,
}: {
  bookingId: string;
  eventId: string;
  currentStatus: "paid" | "reserved" | "pending";
  onUpdated: () => void;
}) {
  const [optimisticStatus, setOptimisticStatus] = useState<"paid" | "reserved" | "pending" | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const displayStatus = optimisticStatus ?? currentStatus;

  // Clear optimistic status once server data catches up
  useEffect(() => {
    if (optimisticStatus && currentStatus === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [currentStatus, optimisticStatus]);

  async function handleChange(newStatus: "paid" | "reserved" | "pending") {
    if (newStatus === displayStatus) {
      setOpen(false);
      return;
    }
    setOptimisticStatus(newStatus);
    setOpen(false);
    try {
      const res = await fetch(`/api/events/${eventId}/participants/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualStatus: newStatus }),
      });
      if (!res.ok) {
        setOptimisticStatus(null);
        throw new Error("Failed");
      }
      onUpdated();
    } catch (error) {
      console.error("Status update failed:", error);
      setOptimisticStatus(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors",
          manualStatusStyle[displayStatus],
        )}
      >
        {displayStatus}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 left-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            {(["paid", "reserved", "pending"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleChange(s)}
                className={cn(
                  "block w-full text-left px-4 py-2 text-xs font-medium capitalize hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                  s === displayStatus
                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getParticipantName(booking: Booking): string {
  if (booking.users?.full_name) return booking.users.full_name;
  if (booking.manual_name) return booking.manual_name;
  return "Guest";
}

function getParticipantEmail(booking: Booking): string {
  if (booking.users?.email) return booking.users.email;
  if (booking.manual_contact) return booking.manual_contact;
  return "—";
}

export default function ParticipantsTable({
  bookings,
  companionsByBooking,
  checkedInUserIds,
  eventId,
  eventStatus,
  isFull,
  onAddParticipant,
}: ParticipantsTableProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [checkInFilter, setCheckInFilter] = useState<CheckInFilter>("all");
  const isCompleted = eventStatus === "completed";

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const name = getParticipantName(booking).toLowerCase();
        const email = getParticipantEmail(booking).toLowerCase();
        if (!name.includes(query) && !email.includes(query)) return false;
      }

      // Payment status filter
      if (paymentFilter !== "all") {
        // For organizer-added participants, use manual_status
        if (booking.added_by && booking.manual_status) {
          if (booking.manual_status !== paymentFilter) return false;
        } else if (booking.payment_status !== paymentFilter) {
          return false;
        }
      }

      // Check-in filter
      if (checkInFilter !== "all" && checkedInUserIds) {
        if (!booking.user_id) return false;
        const isCheckedIn = checkedInUserIds.has(booking.user_id);
        if (checkInFilter === "checked_in" && !isCheckedIn) return false;
        if (checkInFilter === "not_checked_in" && isCheckedIn) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, paymentFilter, checkInFilter, checkedInUserIds]);

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

  const renderStatusBadge = (booking: Booking) => {
    // Organizer-added participant: show interactive dropdown or static badge if completed
    if (booking.added_by && booking.manual_status) {
      if (isCompleted) {
        return <ManualStatusBadge status={booking.manual_status} />;
      }
      return (
        <ManualStatusDropdown
          bookingId={booking.id}
          eventId={eventId}
          currentStatus={booking.manual_status}
          onUpdated={() => router.refresh()}
        />
      );
    }

    // Self-booked: show existing payment status badge
    if (booking.payment_method) {
      return <PaymentStatusBadge status={booking.payment_status} />;
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300">
        confirmed
      </span>
    );
  };

  const renderBookingActions = (booking: Booking) => {
    // Skip normal payment actions for organizer-added participants
    if (booking.added_by) return null;

    const isPending = booking.payment_status === "pending";
    const isEwallet = booking.payment_method === "gcash" || booking.payment_method === "maya";
    const isCash = booking.payment_method === "cash";
    const isBookingLoading = actionLoading === `booking-${booking.id}`;
    const isParticipantLoading = actionLoading === `participant-${booking.id}`;
    const isBookingPaid = booking.payment_status === "paid";

    return (
      <>
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
      </>
    );
  };

  return (
    <>
      {/* Add Participant button — hidden when event is completed, disabled when full */}
      {onAddParticipant && !isCompleted && (
        <div className="mb-4 flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={onAddParticipant} disabled={isFull}>
            + Add Participant
          </Button>
          {isFull && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Event is at full capacity
            </span>
          )}
        </div>
      )}

      {(!bookings || bookings.length === 0) && (
        <p className="text-gray-500 dark:text-gray-400">No participants yet.</p>
      )}

      {bookings && bookings.length > 0 && (
        <>
          {/* Search and filter bar */}
          <div className="mb-4 space-y-3">
            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                Payment:
              </span>
              {PAYMENT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setPaymentFilter(f.value)}
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    paymentFilter === f.value
                      ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {checkedInUserIds && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                  Check-in:
                </span>
                {CHECKIN_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setCheckInFilter(f.value)}
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      checkInFilter === f.value
                        ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* No results message */}
          {filteredBookings.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No matching participants found.
            </p>
          )}

          {/* Mobile card layout */}
          <div className={cn("space-y-3 md:hidden", filteredBookings.length === 0 && "hidden")}>
            {filteredBookings.map((booking) => {
              const comps = companionsByBooking[booking.id] || [];
              const activeComps = comps.filter((c) => c.status !== "cancelled");
              const isBookingPaid = booking.payment_status === "paid";

              return (
                <div
                  key={booking.id}
                  className={cn(
                    "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4",
                    booking.participant_cancelled && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium dark:text-white truncate">
                        <span className={booking.participant_cancelled ? "line-through" : ""}>
                          {getParticipantName(booking)}
                        </span>
                        {booking.participant_cancelled && (
                          <span className="ml-2 text-xs text-red-500 font-normal">cancelled</span>
                        )}
                        {booking.added_by && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            added
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getParticipantEmail(booking)}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {checkedInUserIds && booking.user_id && (
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            checkedInUserIds.has(booking.user_id)
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
                          )}
                        >
                          {checkedInUserIds.has(booking.user_id) ? "Checked in" : "Not checked in"}
                        </span>
                      )}
                      {renderStatusBadge(booking)}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {booking.payment_method && !booking.added_by && (
                      <span>{booking.payment_method.toUpperCase()}</span>
                    )}
                    <span>{new Date(booking.booked_at).toLocaleDateString("en-PH")}</span>
                    {activeComps.length > 0 && (
                      <span>
                        +{activeComps.length} companion{activeComps.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {renderBookingActions(booking)}
                  </div>

                  {comps.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                      {comps.map((comp) => {
                        const isCompLoading = actionLoading === `comp-${comp.id}`;
                        return (
                          <div
                            key={comp.id}
                            className="flex items-center justify-between gap-2 pl-4 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-400">↳</span>
                              <span className="text-gray-600 dark:text-gray-400 truncate">
                                {comp.full_name}
                              </span>
                              <span
                                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${companionStatusStyle[comp.status] || companionStatusStyle.pending}`}
                              >
                                {comp.status}
                              </span>
                            </div>
                            <div className="shrink-0">
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table layout */}
          <div
            className={cn(
              "hidden md:block bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30",
              filteredBookings.length === 0 && "md:hidden",
            )}
          >
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="first:[&>th]:rounded-tl-2xl last:[&>th]:rounded-tr-2xl">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email / Contact
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  {checkedInUserIds && (
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Check-in
                    </th>
                  )}
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
                {filteredBookings.map((booking) => {
                  const comps = companionsByBooking[booking.id] || [];
                  const activeComps = comps.filter((c) => c.status !== "cancelled");
                  const isBookingPaid = booking.payment_status === "paid";

                  return (
                    <Fragment key={booking.id}>
                      <tr className={booking.participant_cancelled ? "opacity-60" : ""}>
                        <td className="px-6 py-4 font-medium dark:text-white">
                          <span className={booking.participant_cancelled ? "line-through" : ""}>
                            {getParticipantName(booking)}
                          </span>
                          {booking.participant_cancelled && (
                            <span className="ml-2 text-xs text-red-500 font-normal">cancelled</span>
                          )}
                          {booking.added_by && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              added
                            </span>
                          )}
                          {activeComps.length > 0 && (
                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
                              +{activeComps.length} companion
                              {activeComps.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {getParticipantEmail(booking)}
                        </td>
                        <td className="px-6 py-4">{renderStatusBadge(booking)}</td>
                        {checkedInUserIds && (
                          <td className="px-6 py-4">
                            {booking.user_id ? (
                              <span
                                className={cn(
                                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                  checkedInUserIds.has(booking.user_id)
                                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
                                )}
                              >
                                {checkedInUserIds.has(booking.user_id) ? "Checked in" : "—"}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {booking.added_by
                            ? "Manual"
                            : booking.payment_method?.toUpperCase() || "Free"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.booked_at).toLocaleDateString("en-PH")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {renderBookingActions(booking)}
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
                            <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">
                              —
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${companionStatusStyle[comp.status] || companionStatusStyle.pending}`}
                              >
                                {comp.status}
                              </span>
                            </td>
                            {checkedInUserIds && (
                              <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">
                                —
                              </td>
                            )}
                            <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">
                              —
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">
                              —
                            </td>
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
        </>
      )}
    </>
  );
}
