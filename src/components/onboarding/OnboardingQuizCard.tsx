"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Input from "@/components/ui/Input";
import TokenRewardToast from "@/components/ui/TokenRewardToast";
import { createClient } from "@/lib/supabase/client";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITIES = [
  { id: "hiking", label: "Hiking", icon: "🥾", gradient: "from-emerald-500 to-emerald-700" },
  { id: "mtb", label: "Mountain Biking", icon: "🚵", gradient: "from-amber-500 to-amber-700" },
  { id: "road_bike", label: "Road Cycling", icon: "🚴", gradient: "from-blue-500 to-blue-700" },
  { id: "running", label: "Running", icon: "🏃", gradient: "from-orange-500 to-orange-700" },
  {
    id: "trail_run",
    label: "Trail Running",
    icon: "🏔️",
    gradient: "from-yellow-700 to-yellow-900",
  },
] as const;

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const DISCOVERY_SOURCES = [
  { id: "social_media", label: "Social Media", icon: "📱" },
  { id: "friend", label: "Friend / Word of Mouth", icon: "👥" },
  { id: "google", label: "Google Search", icon: "🔍" },
  { id: "poster", label: "Event Poster", icon: "📋" },
  { id: "other", label: "Other", icon: "✨" },
] as const;

const TOTAL_STEPS = 3;
const DISMISSED_KEY = "onboarding_quiz_dismissed";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface OnboardingQuizCardProps {
  firstName: string;
}

export default function OnboardingQuizCard({ firstName }: OnboardingQuizCardProps) {
  const supabase = createClient();

  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenReward, setTokenReward] = useState<number | null>(null);

  // Quiz state
  const [activities, setActivities] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [discoverySource, setDiscoverySource] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already dismissed or completed
    try {
      if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem("quiz_completed")) return;
    } catch {
      // localStorage unavailable
    }

    // Check DB for existing completed quiz
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase
        .from("quiz_responses")
        .select("id")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) setVisible(true);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- helpers ------------------------------------------------------- */

  const toggleActivity = (id: string) => {
    setActivities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const allSelected = ACTIVITIES.every((a) => activities.includes(a.id));

  const toggleAll = () => {
    setActivities(allSelected ? [] : ACTIVITIES.map((a) => a.id));
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  };

  const saveResponses = async (skippedAt?: number) => {
    setSaving(true);

    let anonymousId: string;
    try {
      anonymousId = localStorage.getItem("quiz_anonymous_id") ?? crypto.randomUUID();
      localStorage.setItem("quiz_anonymous_id", anonymousId);
      localStorage.setItem("quiz_completed", "true");
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      anonymousId = crypto.randomUUID();
    }

    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: anonymousId,
          activities,
          experience_level: experienceLevel,
          first_name: firstName || null,
          age_range: ageRange,
          location: location || null,
          discovery_source: discoverySource,
          completed_at: skippedAt == null ? new Date().toISOString() : null,
          skipped_at_step: skippedAt ?? null,
        }),
      });
    } catch {
      // fire-and-forget
    }

    if (skippedAt == null) {
      setDone(true);
      setTokenReward(TOKEN_REWARDS.quiz_completed);
    } else {
      setVisible(false);
    }
    setSaving(false);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  /* --- not visible --------------------------------------------------- */

  if (!visible) return null;

  /* --- completion state ---------------------------------------------- */

  if (done) {
    return (
      <>
        {tokenReward && (
          <TokenRewardToast
            amount={tokenReward}
            label="Quiz Completed"
            onDone={() => setTokenReward(null)}
          />
        )}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-6 text-center space-y-2">
          <p className="text-lg font-heading font-bold text-gray-900 dark:text-white">
            Thanks for sharing!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We&apos;ll use this to personalize your experience.
          </p>
        </div>
      </>
    );
  }

  /* --- step renderers ------------------------------------------------ */

  const renderStepActivities = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACTIVITIES.map((activity) => {
          const selected = activities.includes(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggleActivity(activity.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br p-3 transition-all",
                "h-20 sm:h-24",
                activity.gradient,
                selected
                  ? "ring-2 ring-lime-400 ring-offset-2 dark:ring-offset-gray-800"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {selected && (
                <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime-400 text-slate-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span className="text-2xl" role="img" aria-label={activity.label}>
                {activity.icon}
              </span>
              <span className="text-xs font-bold text-white">{activity.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            allSelected
              ? "border-lime-500 bg-lime-500 text-slate-900"
              : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300",
          )}
        >
          All of the above
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Experience Level</p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setExperienceLevel(experienceLevel === level ? null : level)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                experienceLevel === level
                  ? "border-lime-500 bg-lime-500 text-slate-900"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={activities.length === 0}
        className={cn(
          "w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors",
          activities.length > 0
            ? "bg-lime-500 text-slate-900 hover:bg-lime-400"
            : "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-slate-600 dark:text-slate-400",
        )}
      >
        Next
      </button>
    </div>
  );

  const renderStepAboutYou = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Age Range</p>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setAgeRange(ageRange === range ? null : range)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                ageRange === range
                  ? "border-lime-500 bg-lime-500 text-slate-900"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <Input
        id="quiz-location"
        label="Location"
        placeholder="e.g., Iloilo City"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 rounded-xl border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 rounded-xl bg-lime-500 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStepDiscovery = () => (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {DISCOVERY_SOURCES.map((source) => {
          const selected = discoverySource === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setDiscoverySource(selected ? null : source.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-lime-500 bg-lime-50 dark:bg-lime-950/30"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
              )}
            >
              <span className="text-lg" role="img" aria-label={source.label}>
                {source.icon}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  selected
                    ? "text-lime-700 dark:text-lime-300"
                    : "text-gray-700 dark:text-gray-300",
                )}
              >
                {source.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 rounded-xl border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void saveResponses()}
          disabled={saving}
          className="flex-1 rounded-xl bg-lime-500 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Done"}
        </button>
      </div>
    </div>
  );

  /* --- render -------------------------------------------------------- */

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-white">
            Help us personalize your adventure
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Your answers help us recommend events.{" "}
            <Link
              href="/privacy-policy"
              className="underline hover:text-gray-600 dark:hover:text-gray-300"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Dismiss quiz"
        >
          Skip
        </button>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-400">
          {currentStep + 1} of {TOTAL_STEPS}
        </p>
        <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1 rounded-full bg-lime-500 transition-all duration-300"
            style={{ width: `${String(((currentStep + 1) / TOTAL_STEPS) * 100)}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {currentStep === 0 && renderStepActivities()}
      {currentStep === 1 && renderStepAboutYou()}
      {currentStep === 2 && renderStepDiscovery()}
    </div>
  );
}
