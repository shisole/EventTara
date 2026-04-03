"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface EventOption {
  id: string;
  title: string;
  date: string;
  status: string;
}

export default function EmailBlastPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("id, title, date, status")
        .eq("status", "published")
        .order("date", { ascending: true });
      setEvents(data ?? []);
    }
    void fetchEvents();
  }, []);

  useEffect(() => {
    async function fetchCount() {
      const res = await fetch("/api/admin/email-blast");
      if (res.ok) {
        const data: { recipientCount: number } = await res.json();
        setRecipientCount(data.recipientCount);
      }
    }
    void fetchCount();
  }, []);

  async function handleSend() {
    if (!selectedEventId) return;
    setSending(true);
    setError("");
    setResult(null);
    setShowConfirm(false);

    try {
      const res = await fetch("/api/admin/email-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Failed to send");
        return;
      }

      const data: { sent: number; failed: number; total: number } = await res.json();
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white">
        Email Blast
      </h2>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Send a marketing email about an upcoming event to all registered users.
      </p>

      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Event
      </label>
      <select
        value={selectedEventId}
        onChange={(e) => {
          setSelectedEventId(e.target.value);
          setResult(null);
          setError("");
        }}
        className="mb-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="">Choose an event...</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title} —{" "}
            {new Date(ev.date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </option>
        ))}
      </select>

      {recipientCount !== null && (
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          This will be sent to{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {recipientCount.toLocaleString()}
          </span>{" "}
          registered users.
        </p>
      )}

      {showConfirm ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="mb-3 text-sm font-medium text-yellow-200">
            Are you sure you want to send the blast for <strong>{selectedEvent?.title}</strong> to{" "}
            {recipientCount?.toLocaleString()} users?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Yes, Send Now"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={sending}
              className="rounded-lg border border-gray-600 px-5 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!selectedEventId || sending}
          className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send Email Blast
        </button>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
          <p className="text-sm text-teal-200">
            Blast sent! <strong>{result.sent}</strong> delivered
            {result.failed > 0 && (
              <span className="text-red-400">, {result.failed} failed</span>
            )}{" "}
            out of {result.total} total.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
