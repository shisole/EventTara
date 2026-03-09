"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { CheckCircleIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { isReservedUsername } from "@/lib/constants/reserved-usernames";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

function toSuggestedUsername(name: string | null, email: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .toLowerCase()
      .replaceAll(/\s+/g, ".")
      .replaceAll(/[^a-z0-9._-]/g, "");
  }
  if (email) {
    return email
      .split("@")[0]
      .toLowerCase()
      .replaceAll(/[^a-z0-9._-]/g, "");
  }
  return "";
}

function SetupUsernameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") ?? "/feed";

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "reserved"
  >("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill suggested username from user profile
  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      // If user already has a username, skip this page
      void supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) {
            router.replace(next);
            return;
          }
          const meta = user.user_metadata;
          const suggested = toSuggestedUsername(
            meta?.full_name ?? meta?.name ?? null,
            user.email ?? null,
          );
          if (suggested) {
            setUsername(suggested);
            checkUsername(suggested);
          }
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUsername = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const normalized = value.toLowerCase().trim();
    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(normalized)) {
      setUsernameStatus("invalid");
      return;
    }
    if (isReservedUsername(normalized)) {
      setUsernameStatus("reserved");
      return;
    }

    setUsernameStatus("checking");
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(normalized)}`,
        );
        const data: { available: boolean } = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = username.toLowerCase().trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setError(
        "Username must be 3-30 characters: lowercase letters, numbers, dots, underscores, or hyphens.",
      );
      return;
    }
    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push(next);
        router.refresh();
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto: true }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-7 h-7 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            You&apos;re all set!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome, <span className="font-medium text-gray-900 dark:text-white">@{username}</span>!
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Choose Your Username
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pick a username for your EventTara profile
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading} className="min-w-0 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm select-none pointer-events-none">
                @
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replaceAll(/[^a-z0-9._-]/g, "");
                  setUsername(val);
                  checkUsername(val);
                }}
                placeholder="your.username"
                maxLength={30}
                autoFocus
                className={cn(
                  "w-full pl-8 pr-10 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-colors",
                  usernameStatus === "available"
                    ? "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                    : usernameStatus === "taken" ||
                        usernameStatus === "invalid" ||
                        usernameStatus === "reserved"
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                      : "border-gray-300 dark:border-gray-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800",
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <svg
                    className="h-4 w-4 animate-spin text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
                    />
                  </svg>
                )}
                {usernameStatus === "available" && (
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {(usernameStatus === "taken" || usernameStatus === "reserved") && (
                  <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-red-500">This username is already taken</p>
            )}
            {usernameStatus === "reserved" && (
              <p className="text-xs text-red-500">This username is reserved</p>
            )}
            {usernameStatus === "invalid" && username.length > 0 && (
              <p className="text-xs text-red-500">
                3-30 characters: letters, numbers, dots, underscores, hyphens
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600 dark:text-green-400">Username available!</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              loading ||
              usernameStatus === "taken" ||
              usernameStatus === "invalid" ||
              usernameStatus === "reserved"
            }
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </fieldset>
      </form>

      <button
        onClick={handleSkip}
        disabled={loading}
        className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Skip — generate one for me
      </button>
    </div>
  );
}

export default function SetupUsernamePage() {
  return (
    <Suspense>
      <SetupUsernameForm />
    </Suspense>
  );
}
