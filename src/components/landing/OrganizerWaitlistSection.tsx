"use client";

import { type FormEvent, useState } from "react";

interface OrganizerWaitlistSectionProps {
  initialCount: number;
}

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

export default function OrganizerWaitlistSection({ initialCount }: OrganizerWaitlistSectionProps) {
  const [count, setCount] = useState(initialCount);
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

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
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  const showForm = status === "idle" || status === "loading" || status === "error";

  return (
    <section className="bg-lime-400 py-12 dark:bg-lime-500">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
          Run Adventure Events?
        </h2>
        <p className="mb-8 text-lg text-slate-700 dark:text-gray-800">
          Join the waitlist and be the first to know when we open organizer registration. List your
          events, manage check-ins, and reach thousands of adventure seekers.
        </p>

        {/* Counter badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-4 py-2 text-sm font-semibold text-slate-900">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-900" />
            {formatCount(count)}
          </span>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl border-2 border-slate-900/20 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                minLength={2}
                maxLength={100}
                className="flex-1 rounded-xl border-2 border-slate-900/20 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-slate-900 px-8 py-3 text-lg font-semibold text-lime-400 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Joining..." : "Join the Waitlist"}
            </button>
            {status === "error" && (
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            )}
          </form>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl bg-white/80 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl">{status === "already" ? "👋" : "🎉"}</div>
            <p className="text-lg font-semibold text-slate-900">
              {status === "already"
                ? "This email is already on the waitlist!"
                : "You're on the list!"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
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
