"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CheckCircleIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-7 h-7 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            Password Updated!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your password has been reset successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold">Set New Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="password"
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          placeholder="At least 6 characters"
          required
          minLength={6}
        />
        <Input
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
          }}
          placeholder="Re-enter your new password"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>

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
