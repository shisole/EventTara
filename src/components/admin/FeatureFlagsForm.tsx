"use client";

import { useCallback, useEffect, useState } from "react";

import { Toggle } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

const FLAG_META: Record<string, { label: string; description: string }> = {
  activity_feed: {
    label: "Activity Feed",
    description: "Show the social activity feed on user profiles and explore page.",
  },
  strava_showcase_features: {
    label: "Strava Showcase — Features",
    description: "Show the Strava feature highlights section on the homepage.",
  },
  strava_showcase_stats: {
    label: "Strava Showcase — Stats",
    description: "Show the community Strava stats section on the homepage.",
  },
  strava_showcase_route_map: {
    label: "Strava Showcase — Route Map",
    description: "Show the interactive route map preview on the homepage.",
  },
  club_reviews: {
    label: "Club Reviews",
    description: "Allow users to leave reviews directly on club profiles.",
  },
  events_two_col_mobile: {
    label: "Events — 2-Column Mobile Grid",
    description: "Show event cards in a 2-column grid on mobile instead of single column.",
  },
  coming_soon_strava: {
    label: "Lock Strava Showcase",
    description:
      "When enabled, locks the Strava showcase section on the homepage behind a 'Coming Soon' overlay.",
  },
  coming_soon_gamification: {
    label: "Lock Gamification",
    description:
      "When enabled, locks the gamification/badges section on the homepage behind a 'Coming Soon' overlay.",
  },
  coming_soon_bento: {
    label: "Lock Bento Events",
    description:
      "When enabled, locks the bento events section on the homepage behind a 'Coming Soon' overlay.",
  },
  ewallet_payments: {
    label: "E-Wallet Payments",
    description: "Enable GCash and Maya as payment methods for event bookings.",
  },
  oauth_google: {
    label: "Lock Google Login",
    description: "When enabled, locks 'Continue with Google' behind a 'Coming Soon' label.",
  },
  oauth_strava: {
    label: "Lock Strava Login",
    description: "When enabled, locks 'Continue with Strava' behind a 'Coming Soon' label.",
  },
  oauth_facebook: {
    label: "Lock Facebook Login",
    description: "When enabled, locks 'Continue with Facebook' behind a 'Coming Soon' label.",
  },
};

export default function FeatureFlagsForm() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (!res.ok) throw new Error("Failed to load");
        const data: Record<string, unknown> = await res.json();
        delete data.id;
        const parsed: FeatureFlag[] = Object.entries(data).map(([key, value]) => {
          return {
            key,
            label: FLAG_META[key]?.label ?? key,
            description: FLAG_META[key]?.description ?? "",
            value: Boolean(value),
          };
        });
        setFlags(parsed);
      } catch {
        setError("Failed to load feature flags.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleToggle = useCallback(async (key: string, newValue: boolean) => {
    setSaving(key);
    setError(null);
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, value: newValue } : f)));

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, value: !newValue } : f)));
      setError(`Failed to update ${key}.`);
    } finally {
      setSaving(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
      {flags.map((flag) => (
        <div
          key={flag.key}
          className={cn(
            "flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900",
            saving === flag.key && "opacity-60",
          )}
        >
          <div className="min-w-0 mr-4">
            <p className="font-medium text-gray-900 dark:text-white">{flag.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{flag.description}</p>
          </div>
          <Toggle
            checked={flag.value}
            onChange={(v) => handleToggle(flag.key, v)}
            disabled={saving === flag.key}
          />
        </div>
      ))}
    </div>
  );
}
