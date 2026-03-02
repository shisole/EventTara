"use client";

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => globalThis.location.reload()}
      className="mt-6 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
    >
      Try again
    </button>
  );
}
