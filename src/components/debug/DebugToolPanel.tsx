"use client";

import { type User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { type CmsFeatureFlags } from "@/lib/cms/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { useDebugFlags } from "./DebugFlagContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DebugToolPanelProps {
  user: User;
  role: string | null;
  siteSettings: {
    site_name?: string;
    tagline?: string;
    nav_layout?: string;
  } | null;
  heroSlideCount: number;
}

type TabKey = "flags" | "build" | "auth" | "cms";

/* ------------------------------------------------------------------ */
/*  Flag label map                                                     */
/* ------------------------------------------------------------------ */

const FLAG_LABELS: Record<keyof Omit<CmsFeatureFlags, "id">, string> = {
  activity_feed: "Activity Feed",
  strava_showcase_features: "Strava Showcase Features",
  strava_showcase_stats: "Strava Showcase Stats",
  strava_showcase_route_map: "Strava Showcase Route Map",
  organizer_reviews: "Organizer Reviews",
  events_two_col_mobile: "Events 2-Col Mobile",
  coming_soon_strava: "Lock Strava Showcase",
  coming_soon_gamification: "Lock Gamification",
  coming_soon_bento: "Lock Bento Events",
  ewallet_payments: "E-Wallet Payments",
  oauth_google: "Lock Google Login",
  oauth_strava: "Lock Strava Login",
  oauth_facebook: "Lock Facebook Login",
  threejs_hero: "Three.js Hero",
};

type FlagKey = keyof Omit<CmsFeatureFlags, "id">;

/** Type-safe keys derived from FLAG_LABELS (Object.keys loses key types). */
const FLAG_KEYS: FlagKey[] = [
  "activity_feed",
  "strava_showcase_features",
  "strava_showcase_stats",
  "strava_showcase_route_map",
  "organizer_reviews",
  "events_two_col_mobile",
  "coming_soon_strava",
  "coming_soon_gamification",
  "coming_soon_bento",
  "ewallet_payments",
  "oauth_google",
  "oauth_strava",
  "oauth_facebook",
  "threejs_hero",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-400">{label}</span>
      <span className="max-w-[300px] truncate text-gray-200">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function DebugToolPanel({
  user,
  role,
  siteSettings,
  heroSlideCount,
}: DebugToolPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("flags");
  const [copied, setCopied] = useState(false);
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { serverFlags, overrides, setOverride, resetOverrides } = useDebugFlags();

  // Clean up copy timer on unmount
  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);

  // Fetch Strava connection status
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("strava_connections")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStravaConnected(data !== null);
      });
  }, [user.id]);

  // Add padding to body when panel is expanded
  useEffect(() => {
    document.body.style.paddingBottom = open ? "300px" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [open]);

  const handleCopyUserId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API not available
    }
  }, [user.id]);

  const overrideCount = Object.keys(overrides).length;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "flags", label: "Flags" },
    { key: "build", label: "Build" },
    { key: "auth", label: "Auth" },
    { key: "cms", label: "CMS" },
  ];

  /* ------ Collapsed state: small tab button ------ */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-[55]",
          "flex items-center gap-1.5 rounded-lg px-3 py-2",
          "bg-gray-900/95 text-gray-300 backdrop-blur",
          "border border-gray-700 shadow-2xl",
          "font-mono text-xs hover:text-white",
          "transition-colors",
        )}
      >
        <span>&#128295;</span>
        <span>Debug</span>
        {overrideCount > 0 && (
          <span className="ml-1 rounded-full bg-yellow-500/20 px-1.5 text-[10px] text-yellow-400">
            {overrideCount}
          </span>
        )}
      </button>
    );
  }

  /* ------ Expanded state: full-width bottom panel ------ */

  // Compute flag counts for CMS tab
  const totalFlags = FLAG_KEYS.length;
  const enabledFlags = serverFlags
    ? FLAG_KEYS.filter((k) => {
        const overridden = overrides[k];
        return overridden ?? serverFlags[k];
      }).length
    : 0;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[55]",
        "flex max-h-[300px] flex-col",
        "bg-gray-900/95 backdrop-blur",
        "border-t border-gray-700 shadow-2xl",
        "font-mono text-xs text-gray-300",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span>&#128295;</span>
          <span className="font-semibold text-gray-200">Debug Panel</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded px-2 py-0.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Minimize"
        >
          &#8211;
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 transition-colors",
              tab === t.key
                ? "border-b-2 border-teal-400 text-teal-400"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ---- Flags tab ---- */}
        {tab === "flags" && (
          <div className="space-y-2">
            {overrideCount > 0 && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-yellow-400">
                  {overrideCount} override{overrideCount === 1 ? "" : "s"} active
                </span>
                <button
                  onClick={resetOverrides}
                  className="rounded bg-gray-800 px-2 py-0.5 text-gray-400 hover:text-white"
                >
                  Reset all
                </button>
              </div>
            )}
            {serverFlags &&
              FLAG_KEYS.map((key) => {
                const isOverridden = overrides[key] !== undefined;
                const currentValue = isOverridden ? overrides[key] : serverFlags[key];
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{FLAG_LABELS[key]}</span>
                      {isOverridden && (
                        <span className="rounded bg-yellow-500/20 px-1.5 text-[10px] text-yellow-400">
                          overridden
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setOverride(key, !currentValue)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        currentValue ? "bg-teal-500" : "bg-gray-600",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          currentValue && "translate-x-4",
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            {!serverFlags && <span className="text-gray-500">No flag data available</span>}
          </div>
        )}

        {/* ---- Build tab ---- */}
        {tab === "build" && (
          <div className="space-y-1">
            <Row
              label="Git SHA"
              value={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev"}
            />
            <Row label="Branch" value={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? "local"} />
            <Row
              label="Environment"
              value={process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV}
            />
            <Row label="Next.js" value="15.5.12" />
            <Row label="React" value="19" />
          </div>
        )}

        {/* ---- Auth tab ---- */}
        {tab === "auth" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-400">User ID</span>
              <button
                onClick={() => void handleCopyUserId()}
                className="max-w-[300px] truncate text-gray-200 hover:text-white"
              >
                {copied ? <span className="text-teal-400">copied!</span> : user.id}
              </button>
            </div>
            <Row label="Email" value={user.email ?? "—"} />
            <Row label="Role" value={role ?? "—"} />
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-400">Admin</span>
              <span className="rounded bg-teal-500/20 px-1.5 text-teal-400">yes</span>
            </div>
            <Row label="Anonymous" value={user.is_anonymous ? "yes" : "no"} />
            <Row label="Provider" value={user.app_metadata.provider ?? "—"} />
            <Row
              label="Strava"
              value={
                stravaConnected === null
                  ? "checking..."
                  : stravaConnected
                    ? "connected"
                    : "not connected"
              }
            />
          </div>
        )}

        {/* ---- CMS tab ---- */}
        {tab === "cms" && (
          <div className="space-y-1">
            <Row label="Site Name" value={siteSettings?.site_name ?? "—"} />
            <Row label="Tagline" value={siteSettings?.tagline ?? "—"} />
            <Row label="Nav Layout" value={siteSettings?.nav_layout ?? "—"} />
            <Row label="Hero Slides" value={String(heroSlideCount)} />
            <Row
              label="Feature Flags"
              value={`${String(enabledFlags)} of ${String(totalFlags)} enabled`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
