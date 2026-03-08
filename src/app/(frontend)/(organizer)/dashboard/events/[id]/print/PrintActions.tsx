"use client";

import Link from "next/link";

export default function PrintActions({ eventId }: { eventId: string }) {
  return (
    <div className="no-print mb-6 flex items-center gap-3">
      <button
        onClick={() => globalThis.print()}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
      >
        Print
      </button>
      <Link
        href={`/dashboard/events/${eventId}`}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Back to Event
      </Link>
    </div>
  );
}
