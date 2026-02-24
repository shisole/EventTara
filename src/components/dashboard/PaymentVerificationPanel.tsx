"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";
import { cn } from "@/lib/utils";

interface BookingUser {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface PaymentBooking {
  id: string;
  status: string;
  payment_status: "pending" | "paid" | "rejected" | "refunded";
  payment_method: string;
  payment_proof_url: string | null;
  booked_at: string;
  users: BookingUser;
  companion_count?: number;
}

interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  rejected: number;
  cash: number;
  revenue: number;
}

interface PaymentVerificationPanelProps {
  eventId: string;
  eventPrice: number;
}

type FilterTab = "all" | "pending" | "paid" | "rejected";

export default function PaymentVerificationPanel({
  eventId,
  eventPrice,
}: PaymentVerificationPanelProps) {
  const [bookings, setBookings] = useState<PaymentBooking[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    paid: 0,
    pending: 0,
    rejected: 0,
    cash: 0,
    revenue: 0,
  });
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/payments`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setBookings(data.bookings);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleAction = async (bookingId: string, action: "approve" | "reject") => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      setViewingProof(null);
      setViewingBookingId(null);
      await fetchData();
    } catch (error) {
      console.error("Payment action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.payment_status === filter;
  });

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case "gcash": {
        return "GCash";
      }
      case "maya": {
        return "Maya";
      }
      case "cash": {
        return "Cash";
      }
      default: {
        return method?.toUpperCase() || "N/A";
      }
    }
  };

  const paymentMethodStyle = (method: string) => {
    switch (method) {
      case "gcash": {
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      }
      case "maya": {
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      }
      case "cash": {
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      }
      default: {
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30 border-l-4 border-forest-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
          <p className="text-2xl font-bold text-forest-600 dark:text-forest-400">
            ₱{stats.revenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30 border-l-4 border-gray-400">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cash (on-day)</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.cash}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(["all", "pending", "paid", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab);
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize",
              filter === tab
                ? "bg-white dark:bg-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {tab}
            {tab !== "all" && (
              <span className="ml-1 text-xs opacity-60">
                ({tab === "pending" ? stats.pending : tab === "paid" ? stats.paid : stats.rejected})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium dark:text-gray-300">
            No {filter === "all" ? "" : filter} bookings found
          </p>
          <p className="text-sm mt-1">Payment submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isEwallet =
              booking.payment_method === "gcash" || booking.payment_method === "maya";
            const isPending = booking.payment_status === "pending";
            const isCash = booking.payment_method === "cash";

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate dark:text-white">
                    {booking.users?.full_name || "Guest"}
                    {booking.companion_count && booking.companion_count > 0 && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
                        +{booking.companion_count} companion
                        {booking.companion_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.booked_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      paymentMethodStyle(booking.payment_method),
                    )}
                  >
                    {paymentMethodLabel(booking.payment_method)}
                  </span>
                  <PaymentStatusBadge status={booking.payment_status} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPending && isEwallet && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingProof(booking.payment_proof_url);
                          setViewingBookingId(booking.id);
                        }}
                        disabled={!booking.payment_proof_url}
                      >
                        View Proof
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(booking.id, "approve")}
                        disabled={actionLoading === booking.id}
                      >
                        {actionLoading === booking.id ? "..." : "Approve"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAction(booking.id, "reject")}
                        disabled={actionLoading === booking.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {isPending && isCash && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(booking.id, "approve")}
                      disabled={actionLoading === booking.id}
                    >
                      {actionLoading === booking.id ? "..." : "Mark as Paid"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewingProof && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setViewingProof(null);
            setViewingBookingId(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 max-w-lg w-full"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <img src={viewingProof} alt="Payment proof" className="w-full rounded-xl" />
            <div className="flex gap-3 mt-4 justify-end">
              {viewingBookingId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (viewingBookingId) handleAction(viewingBookingId, "reject");
                    }}
                    disabled={actionLoading === viewingBookingId}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (viewingBookingId) handleAction(viewingBookingId, "approve");
                    }}
                    disabled={actionLoading === viewingBookingId}
                  >
                    {actionLoading === viewingBookingId ? "Approving..." : "Approve Payment"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
