"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface EventOption {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface BlastOverrides {
  subject: string;
  headline: string;
  subtext: string;
  customMessage: string;
  eventLocation: string;
  eventDate: string;
}

const EMPTY_OVERRIDES: BlastOverrides = {
  subject: "",
  headline: "",
  subtext: "",
  customMessage: "",
  eventLocation: "",
  eventDate: "",
};

export default function EmailBlastPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<BlastOverrides>(EMPTY_OVERRIDES);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load defaults + initial preview when event changes
  useEffect(() => {
    if (!selectedEventId) {
      setOverrides(EMPTY_OVERRIDES);
      setPreviewHtml("");
      setRecipientCount(null);
      return;
    }

    async function loadDefaults() {
      const res = await fetch(`/api/admin/email-blast?eventId=${selectedEventId}`);
      if (!res.ok) {
        setError("Failed to load preview");
        return;
      }
      const data: {
        recipientCount: number;
        defaults: BlastOverrides;
        html: string;
      } = await res.json();
      setRecipientCount(data.recipientCount);
      setOverrides(data.defaults);
      setPreviewHtml(data.html);
    }
    void loadDefaults();
  }, [selectedEventId]);

  // Debounced live preview refresh on override changes
  useEffect(() => {
    if (!selectedEventId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/email-blast/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: selectedEventId, ...overrides }),
        });
        if (res.ok) {
          const data: { html: string } = await res.json();
          setPreviewHtml(data.html);
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [overrides, selectedEventId]);

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
        body: JSON.stringify({ eventId: selectedEventId, ...overrides }),
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

  function updateField<K extends keyof BlastOverrides>(key: K, value: BlastOverrides[K]) {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white">
        Email Blast
      </h2>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Send a marketing email about an upcoming event to all registered users. Edit the fields
        below and preview the email before sending.
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

      {selectedEventId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Edit fields */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
              Email Content
            </h3>

            <Field label="Subject">
              <input
                type="text"
                value={overrides.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            <Field
              label="Headline"
              hint="Big hero headline at the top. Leave blank to use the default for the event type."
            >
              <input
                type="text"
                value={overrides.headline}
                placeholder="The Mountain is Calling!"
                onChange={(e) => updateField("headline", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            <Field label="Subtext" hint="One-liner under the headline. Leave blank for default.">
              <input
                type="text"
                value={overrides.subtext}
                placeholder="Lace up your boots — an epic climb awaits."
                onChange={(e) => updateField("subtext", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            <Field
              label="Custom Message"
              hint="Free-text paragraph shown above the event details. Great for your own pitch or description."
            >
              <textarea
                value={overrides.customMessage}
                onChange={(e) => updateField("customMessage", e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            <Field label="Location">
              <input
                type="text"
                value={overrides.eventLocation}
                onChange={(e) => updateField("eventLocation", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            <Field label="Date Label">
              <input
                type="text"
                value={overrides.eventDate}
                onChange={(e) => updateField("eventDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </Field>

            {recipientCount !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  Are you sure you want to send the blast for{" "}
                  <strong>{selectedEvent?.title}</strong> to {recipientCount?.toLocaleString()}{" "}
                  users?
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
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
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
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                Preview
              </h3>
              {previewLoading && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Updating…</span>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-700">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                sandbox=""
                className="h-[720px] w-full bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
