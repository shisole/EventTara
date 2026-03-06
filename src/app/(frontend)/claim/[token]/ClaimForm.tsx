"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface ClaimFormProps {
  token: string;
  orgName: string;
  logoUrl: string | null;
  pendingUsername: string | null;
}

export default function ClaimForm({ token, orgName, logoUrl, pendingUsername }: ClaimFormProps) {
  const router = useRouter();
  const [editedOrgName, setEditedOrgName] = useState(orgName);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [existingUserName, setExistingUserName] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setExistingUserId(user.id);
        setExistingUserName(user.user_metadata?.full_name ?? user.email ?? "your account");
      }
      setCheckingAuth(false);
    }
    void checkAuth();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = existingUserId
        ? { org_name: editedOrgName, existing_user_id: existingUserId }
        : { email, password, full_name: fullName, org_name: editedOrgName };

      const res = await fetch(`/api/claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // If new user, sign them in
      if (!existingUserId) {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError("Account created but login failed. Please go to the login page.");
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Account Claimed!</h1>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={orgName}
            width={64}
            height={64}
            className="mx-auto rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100 dark:bg-lime-900/30">
            <span className="text-2xl font-bold text-lime-700 dark:text-lime-400">
              {orgName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Claim Your Organizer Account
        </h1>
        {existingUserId && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">{existingUserName}</span>
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Input
          id="org-name"
          label="Organization Name"
          value={editedOrgName}
          onChange={(e) => setEditedOrgName(e.target.value)}
          required
        />

        {!existingUserId && pendingUsername && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              @{pendingUsername}
            </div>
          </div>
        )}

        {!existingUserId && (
          <>
            <Input
              id="full-name"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Claiming..." : existingUserId ? "Link to My Account" : "Claim Account"}
      </Button>
    </form>
  );
}
