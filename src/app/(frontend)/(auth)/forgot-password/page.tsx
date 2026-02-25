"use client";

import Link from "next/link";
import { useState } from "react";

import { EnvelopeIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${globalThis.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
            <EnvelopeIcon className="w-7 h-7 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We sent a password reset link to{" "}
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>. Click the
            link in the email to reset your password.
          </p>
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/login"
            className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold">Reset Your Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder="you@example.com"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
