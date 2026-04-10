"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface DemoAccount {
  email: string;
  password: string;
  name: string;
  username: string;
  redirect: string;
}

const ORGANIZERS: DemoAccount[] = [
  {
    email: "organizer1@test.eventtara.com",
    password: "TestPass123!",
    name: "Marco Santos",
    username: "marco_trails",
    redirect: "/dashboard",
  },
  {
    email: "organizer2@test.eventtara.com",
    password: "TestPass123!",
    name: "Ana Reyes",
    username: "ana_pedal",
    redirect: "/dashboard",
  },
  {
    email: "organizer3@test.eventtara.com",
    password: "TestPass123!",
    name: "Jay Tablatin",
    username: "jtt_trails",
    redirect: "/dashboard",
  },
  {
    email: "organizer4@test.eventtara.com",
    password: "TestPass123!",
    name: "Teri Magbanua",
    username: "ftt_treks",
    redirect: "/dashboard",
  },
  {
    email: "organizer5@test.eventtara.com",
    password: "TestPass123!",
    name: "Yen Casimiro",
    username: "yenergy_out",
    redirect: "/dashboard",
  },
  {
    email: "organizer6@test.eventtara.com",
    password: "TestPass123!",
    name: "Ruben Torres",
    username: "ruborubo",
    redirect: "/dashboard",
  },
];

const PARTICIPANTS: DemoAccount[] = [
  {
    email: "participant1@test.eventtara.com",
    password: "TestPass123!",
    name: "Jake Mendoza",
    username: "jake_adventure",
    redirect: "/events",
  },
  {
    email: "participant2@test.eventtara.com",
    password: "TestPass123!",
    name: "Maria Cruz",
    username: "maria_explorer",
    redirect: "/events",
  },
  {
    email: "participant3@test.eventtara.com",
    password: "TestPass123!",
    name: "Carlos Rivera",
    username: "carlos_hiker",
    redirect: "/events",
  },
];

const DISMISS_KEY = "demo-banner-dismissed";

interface DemoBannerProps {
  isLoggedIn: boolean;
  onVisibilityChange?: (visible: boolean, height: number) => void;
}

function AccountDropdown({
  label,
  accounts,
  loading,
  onLogin,
}: {
  label: string;
  accounts: DemoAccount[];
  loading: string | null;
  onLogin: (account: DemoAccount) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target: Node | null = e.target instanceof Node ? e.target : null;
      if (ref.current && target && !ref.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading !== null}
        className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium transition-colors hover:bg-white/30 disabled:opacity-50"
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[999] mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {accounts.map((account) => (
            <button
              key={account.email}
              onClick={() => {
                setOpen(false);
                onLogin(account);
              }}
              disabled={loading !== null}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {loading === account.email ? "Signing in..." : account.name}
                </p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  @{account.username}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemoBanner({ isLoggedIn, onVisibilityChange }: DemoBannerProps) {
  const router = useRouter();
  const supabase = createClient();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof globalThis === "undefined" || !globalThis.localStorage) return false;
    return globalThis.localStorage.getItem(DISMISS_KEY) === "true";
  });
  const [loading, setLoading] = useState<string | null>(null);

  const isVisible = !isLoggedIn && !dismissed;

  useEffect(() => {
    if (isVisible && bannerRef.current) {
      onVisibilityChange?.(true, bannerRef.current.offsetHeight);
    } else {
      onVisibilityChange?.(false, 0);
    }
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) return null;

  const handleDemoLogin = async (account: DemoAccount) => {
    setLoading(account.email);

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
    onVisibilityChange?.(false, 0);
  };

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[51] bg-gradient-to-r from-teal-600 to-forest-600 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="font-medium">This is a demo</span>
            <span className="hidden sm:inline text-white/60">|</span>
            <div className="flex items-center gap-2">
              <span className="text-white/80">Try as</span>
              <AccountDropdown
                label="Organizer"
                accounts={ORGANIZERS}
                loading={loading}
                onLogin={(account) => void handleDemoLogin(account)}
              />
              <span className="text-white/60">or</span>
              <AccountDropdown
                label="Participant"
                accounts={PARTICIPANTS}
                loading={loading}
                onLogin={(account) => void handleDemoLogin(account)}
              />
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
