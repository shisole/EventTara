"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "already_registered" | "error";

interface WaitlistResponse {
  success?: boolean;
  already_registered?: boolean;
  error?: string;
  display?: string;
}

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [display, setDisplay] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: WaitlistResponse = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setDisplay(data.display ?? "");
      setStatus(data.already_registered ? "already_registered" : "success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className="bg-gray-50 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Get Early Access
        </h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          Be the first to know when EventTara launches
        </p>

        {status === "success" || status === "already_registered" ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 dark:border-teal-800 dark:bg-teal-950/50">
            <span className="mb-2 block text-3xl">
              {status === "already_registered" ? "\u{1F44B}" : "\u{1F389}"}
            </span>
            <p className="text-lg font-semibold text-teal-800 dark:text-teal-300">
              {status === "already_registered"
                ? "You're already on the list!"
                : "You're on the list!"}
            </p>
            {display && <p className="mt-2 text-sm text-teal-700 dark:text-teal-400">{display}</p>}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-72"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-700 sm:w-auto"
            >
              {status === "submitting" ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
