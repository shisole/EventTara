"use client";

import { useEffect, useState } from "react";

import { Button, UserAvatar } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  type: "user" | "companion";
  fullName: string;
  avatarUrl: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  borderTier?: BorderTier | null;
  borderColor?: string | null;
}

export default function CheckinList({
  eventId,
  initialParticipants,
}: {
  eventId: string;
  initialParticipants: Participant[];
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const supabase = createClient();

  // Listen for local check-in events from QRScanner
  useEffect(() => {
    const handleCheckin = (e: Event) => {
      const detail: { type: "user" | "companion"; id: string } =
        (e instanceof CustomEvent && e.detail) || {};
      const { type, id } = detail;
      setParticipants((prev) =>
        prev.map((p) =>
          p.type === type && p.id === id
            ? { ...p, checkedIn: true, checkedInAt: new Date().toISOString() }
            : p,
        ),
      );
    };
    globalThis.addEventListener("checkin-success", handleCheckin);
    return () => globalThis.removeEventListener("checkin-success", handleCheckin);
  }, []);

  useEffect(() => {
    // Subscribe to user check-ins (Realtime fallback)
    const checkinChannel = supabase
      .channel(`checkins-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_checkins",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.type === "user" && p.id === payload.new.user_id
                ? { ...p, checkedIn: true, checkedInAt: payload.new.checked_in_at }
                : p,
            ),
          );
        },
      )
      .subscribe();

    // Subscribe to companion check-ins
    const companionChannel = supabase
      .channel(`companion-checkins-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "booking_companions",
        },
        (payload) => {
          if (payload.new.checked_in) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.type === "companion" && p.id === payload.new.id
                  ? { ...p, checkedIn: true, checkedInAt: payload.new.checked_in_at }
                  : p,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(checkinChannel);
      void supabase.removeChannel(companionChannel);
    };
  }, [eventId, supabase]);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const checkedInCount = participants.filter((p) => p.checkedIn).length;

  const handleManualCheckin = async (p: Participant) => {
    setLoadingId(`${p.type}-${p.id}`);
    try {
      const body: Record<string, string> =
        p.type === "companion"
          ? { event_id: eventId, companion_id: p.id, force: "true" }
          : { event_id: eventId, user_id: p.id, force: "true" };

      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok || res.status === 200) {
        setParticipants((prev) =>
          prev.map((item) =>
            item.type === p.type && item.id === p.id
              ? { ...item, checkedIn: true, checkedInAt: new Date().toISOString() }
              : item,
          ),
        );
      }
    } catch (error) {
      console.error("[CheckinList] Check-in failed:", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold dark:text-white">Participants</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {checkedInCount}/{participants.length} checked in
        </span>
      </div>
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={`${p.type}-${p.id}`}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl",
              p.checkedIn ? "bg-forest-50 dark:bg-forest-900/30" : "bg-white dark:bg-gray-900",
            )}
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                src={p.avatarUrl}
                alt={p.fullName}
                size="sm"
                borderTier={p.borderTier ?? null}
                borderColor={p.borderColor ?? null}
              />
              <span className="font-medium dark:text-white">{p.fullName}</span>
            </div>
            {p.checkedIn ? (
              <span className="text-sm font-medium text-forest-600">Checked In</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManualCheckin(p)}
                disabled={loadingId === `${p.type}-${p.id}`}
              >
                {loadingId === `${p.type}-${p.id}` ? "..." : "Check In"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
