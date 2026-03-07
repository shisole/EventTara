"use client";

import { type FormEvent, useEffect, useState } from "react";

const STORAGE_KEY = "waitlist-joined";

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

export default function OrganizerWaitlistSection() {
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  // Check localStorage and fetch count on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        setAlreadyJoined(true);
      }
    } catch {
      // localStorage unavailable
    }

    fetch("/api/waitlist/count")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {
        // Silently fail — counter stays at 0
      });
  }, []);

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

  const showForm = status === "idle" || status === "loading" || status === "error";

  return (
    <section className="bg-gray-50 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Host Adventure Events?
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Join the waitlist and be the first to know when we open organizer registration. List your
          events, manage check-ins, and reach thousands of adventure seekers.
        </p>

        {/* Counter badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-1.5 text-sm font-semibold text-lime-800 dark:bg-lime-900/30 dark:text-lime-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-lime-600 dark:bg-lime-400" />
            {formatCount(count)}
          </span>
        </div>

        {alreadyJoined && showForm ? (
          <div>
            <div className="mb-2 text-3xl">🎉</div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              You&apos;re on the list!
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              We&apos;ll reach out when we&apos;re ready. Stay tuned!
            </p>
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
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
            </div>
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
          <div>
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
          </div>
        )}
      </div>
    </section>
  );
}
