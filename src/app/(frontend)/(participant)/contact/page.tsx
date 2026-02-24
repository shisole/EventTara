"use client";

import { useState, type FormEvent } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      setStatus("error");
      setErrorMsg(error.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="py-20 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
          Contact Us
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Have a question, suggestion, or just want to say hi? We&apos;d love to hear from you.
        </p>

        {status === "success" ? (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 text-center">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
              Message Sent!
            </h2>
            <p className="text-green-700 dark:text-green-400">
              Thanks for reaching out. We&apos;ll get back to you as soon as we can.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="name"
              label="Name"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-y-1">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="How can we help?"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors resize-vertical"
              />
            </div>

            {status === "error" && <p className="text-sm text-red-500">{errorMsg}</p>}

            <Button type="submit" size="lg" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
