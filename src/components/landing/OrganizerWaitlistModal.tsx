"use client";

import { type FormEvent, useEffect, useState } from "react";

const STORAGE_KEY = "waitlist-joined";
const SHOW_DELAY_MS = 3000;

function formatCount(count: number): string {
  if (count === 0) return "Be the first to join!";
  if (count < 10) return `${count} organizer${count === 1 ? "" : "s"} waiting`;
  if (count < 100) {
    const rounded = Math.floor(count / 10) * 10;
    return `${rounded}+ organizers waiting`;
  }
  const rounded = Math.floor(count / 50) * 50;
  return `${rounded}+ organizers waiting`;
}

export default function OrganizerWaitlistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Show modal after delay if not dismissed
  useEffect(() => {
    if (
      globalThis.location !== undefined &&
      new URLSearchParams(globalThis.location.search).has("lighthouse")
    )
      return;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // If localStorage unavailable, proceed to show modal
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Delay before enabling dismiss controls
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setReady(true);
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible]);

  // Fetch count when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/waitlist/count")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {
        // Silently fail — counter stays at 0
      });
  }, [isOpen]);

  // Escape key support
  useEffect(() => {
    if (!isOpen || !ready) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, ready]);

  function handleDismiss() {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, org_name: orgName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }

      if (data.already_registered) {
        setStatus("already");
      } else {
        setStatus("success");
      }

      if (data.raw !== undefined) {
        setCount(data.raw);
      }

      // Persist so modal never shows again once joined
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Silently fail
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (!isOpen) return null;

  const showForm = status === "idle" || status === "loading" || status === "error";

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
      onClick={ready ? handleDismiss : undefined}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all duration-200 dark:bg-slate-800 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          disabled={!ready}
          className={`absolute right-4 top-4 transition-colors ${
            ready
              ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              : "cursor-not-allowed text-gray-200 dark:text-slate-600"
          }`}
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="mb-4 text-center">
          <span className="text-5xl" role="img" aria-label="megaphone">
            📣
          </span>
        </div>

        {/* Title */}
        <h2
          id="waitlist-modal-title"
          className="mb-2 text-center font-heading text-2xl font-bold text-gray-900 dark:text-white"
        >
          Host Adventure Events?
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Join the waitlist and be the first to know when we open organizer registration. List your
          events, manage check-ins, and reach thousands of adventure seekers.
        </p>

        {/* Counter badge */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-1.5 text-sm font-semibold text-lime-800 dark:bg-lime-900/30 dark:text-lime-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-lime-600 dark:bg-lime-400" />
            {formatCount(count)}
          </span>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-lime-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-lime-500"
            />
            <input
              type="text"
              required
              placeholder="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              minLength={2}
              maxLength={100}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-lime-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-lime-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-lime-500 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Joining..." : "Join the Waitlist"}
            </button>
            {status === "error" && (
              <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-2 text-3xl">{status === "already" ? "👋" : "🎉"}</div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {status === "already"
                ? "This email is already on the waitlist!"
                : "You're on the list!"}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {status === "already"
                ? "We've got you covered. We'll be in touch soon."
                : "Check your inbox for a confirmation email. We'll reach out when we're ready."}
            </p>
            <button
              onClick={handleDismiss}
              className="mt-4 rounded-xl bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
