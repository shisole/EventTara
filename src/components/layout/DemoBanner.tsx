"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const DEMO_ACCOUNTS = {
  organizer: {
    email: "organizer1@test.eventtara.com",
    password: "TestPass123!",
    label: "Organizer",
    redirect: "/dashboard",
  },
  participant: {
    email: "participant1@test.eventtara.com",
    password: "TestPass123!",
    label: "Participant",
    redirect: "/events",
  },
};

const DISMISS_KEY = "demo-banner-dismissed";

interface DemoBannerProps {
  isLoggedIn: boolean;
}

export default function DemoBanner({ isLoggedIn }: DemoBannerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) return false;
    return globalThis.localStorage.getItem(DISMISS_KEY) === "true";
  });
  const [loading, setLoading] = useState<string | null>(null);

  if (isLoggedIn || dismissed) return null;

  const handleDemoLogin = async (role: "organizer" | "participant") => {
    setLoading(role);
    const account = DEMO_ACCOUNTS[role];

    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error) {
      setLoading(null);
      return;
    }

    router.push(account.redirect);
    router.refresh();
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-teal-600 to-forest-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="font-medium">This is a demo</span>
            <span className="hidden sm:inline text-white/60">|</span>
            <div className="flex items-center gap-2">
              <span className="text-white/80">Try as</span>
              <button
                onClick={() => void handleDemoLogin("organizer")}
                disabled={loading !== null}
                className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium transition-colors hover:bg-white/30 disabled:opacity-50"
              >
                {loading === "organizer" ? "Signing in..." : "Organizer"}
              </button>
              <span className="text-white/60">or</span>
              <button
                onClick={() => void handleDemoLogin("participant")}
                disabled={loading !== null}
                className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium transition-colors hover:bg-white/30 disabled:opacity-50"
              >
                {loading === "participant" ? "Signing in..." : "Participant"}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded p-1 text-white/60 transition-colors hover:text-white"
            aria-label="Dismiss demo banner"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
