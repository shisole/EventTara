"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Input from "@/components/ui/Input";
import { type CmsFeatureFlags } from "@/lib/cms/types";
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

const VALUE_PROPS = [
  "Save and track your favorite events",
  "Earn badges and achievements",
  "Connect your Strava activities",
];

const TOTAL_STEPS = 4;
const STORAGE_KEY = "quiz_completed";
const PROGRESS_KEY = "quiz_progress";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface OnboardingQuizModalProps {
  featureFlags?: CmsFeatureFlags | null;
}

export default function OnboardingQuizModal({ featureFlags }: OnboardingQuizModalProps) {
  const router = useRouter();

  /* --- modal visibility ------------------------------------------- */
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  /* --- quiz state (restore from localStorage if available) -------- */
  const [restoredProgress] = useState<{
    currentStep: number;
    activities: string[];
    experienceLevel: string | null;
    firstName: string;
    ageRange: string | null;
    location: string;
    discoverySource: string | null;
  } | null>(() => {
    if (typeof globalThis === "undefined") return null;
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      const p: Record<string, unknown> = parsed;
      return {
        currentStep: typeof p.currentStep === "number" ? p.currentStep : 0,
        activities: Array.isArray(p.activities)
          ? p.activities.filter((a): a is string => typeof a === "string")
          : [],
        experienceLevel: typeof p.experienceLevel === "string" ? p.experienceLevel : null,
        firstName: typeof p.firstName === "string" ? p.firstName : "",
        ageRange: typeof p.ageRange === "string" ? p.ageRange : null,
        location: typeof p.location === "string" ? p.location : "",
        discoverySource: typeof p.discoverySource === "string" ? p.discoverySource : null,
      };
    } catch {
      return null;
    }
  });

  const [currentStep, setCurrentStep] = useState(restoredProgress?.currentStep ?? 0);
  const [activities, setActivities] = useState<string[]>(restoredProgress?.activities ?? []);
  const [experienceLevel, setExperienceLevel] = useState<string | null>(
    restoredProgress?.experienceLevel ?? null,
  );
  const [firstName, setFirstName] = useState(restoredProgress?.firstName ?? "");
  const [ageRange, setAgeRange] = useState<string | null>(restoredProgress?.ageRange ?? null);
  const [location, setLocation] = useState(restoredProgress?.location ?? "");
  const [discoverySource, setDiscoverySource] = useState<string | null>(
    restoredProgress?.discoverySource ?? null,
  );

  /* --- anonymous id (generate once, persist) ---------------------- */
  const [anonymousId] = useState(() => {
    if (typeof globalThis === "undefined") return "";
    try {
      const existing = localStorage.getItem("quiz_anonymous_id");
      if (existing) return existing;
      const id = crypto.randomUUID();
      localStorage.setItem("quiz_anonymous_id", id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  });

  /* --- mount: decide whether to open ------------------------------ */
  useEffect(() => {
    if (new URLSearchParams(globalThis.location.search).has("lighthouse")) return;

    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setIsOpen(true);
        document.body.style.overflow = "hidden";
        setTimeout(() => setIsVisible(true), 10);
      }
    } catch {
      setIsOpen(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setIsVisible(true), 10);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* --- escape key (temporary dismiss, not skip) ------------------- */
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        // Save progress to localStorage so quiz resumes on next visit
        try {
          localStorage.setItem(
            PROGRESS_KEY,
            JSON.stringify({
              currentStep,
              activities,
              experienceLevel,
              firstName,
              ageRange,
              location,
              discoverySource,
            }),
          );
        } catch {
          // localStorage unavailable
        }
        setIsVisible(false);
        document.body.style.overflow = "";
        setTimeout(() => setIsOpen(false), 200);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [
    isOpen,
    currentStep,
    activities,
    experienceLevel,
    firstName,
    ageRange,
    location,
    discoverySource,
  ]);

  /* --- feature flag gate ------------------------------------------ */
  if (!featureFlags?.onboarding_quiz) return null;

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const handleClose = () => {
    setIsVisible(false);
    document.body.style.overflow = "";
    setTimeout(() => setIsOpen(false), 200);
  };

  /** Save current progress to localStorage so the quiz resumes on next visit */
  const saveProgress = () => {
    try {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
          currentStep,
          activities,
          experienceLevel,
          firstName,
          ageRange,
          location,
          discoverySource,
        }),
      );
    } catch {
      // localStorage unavailable
    }
  };

  /** Temporarily close (Escape / backdrop) — saves progress, reopens next visit */
  const handleDismiss = () => {
    saveProgress();
    handleClose();
  };

  const saveResponses = async (skippedAt?: number) => {
    const payload = {
      anonymous_id: anonymousId,
      activities,
      experience_level: experienceLevel,
      first_name: firstName || null,
      age_range: ageRange,
      location: location || null,
      discovery_source: discoverySource,
      completed_at: skippedAt == null ? new Date().toISOString() : null,
      skipped_at_step: skippedAt ?? null,
    };

    try {
      localStorage.setItem("quiz_responses", JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // localStorage unavailable
    }

    fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // fire-and-forget: silently ignore save failures
    });
  };

  const handleSkip = async () => {
    await saveResponses(currentStep);
    handleClose();
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleCreateAccount = async () => {
    await saveResponses();
    handleClose();
    router.push("/signup");
  };

  const handleContinueAsGuest = async () => {
    await saveResponses();
    handleClose();
  };

  /* --- activity toggle helpers ------------------------------------ */
  const toggleActivity = (id: string) => {
    setActivities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const allSelected = ACTIVITIES.every((a) => activities.includes(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setActivities([]);
    } else {
      setActivities(ACTIVITIES.map((a) => a.id));
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step renderers                                                   */
  /* ---------------------------------------------------------------- */

  const renderStepActivities = () => (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white sm:text-2xl">
          What adventures interest you?
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select all that apply</p>
      </div>

      {/* Activity grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ACTIVITIES.map((activity) => {
          const selected = activities.includes(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggleActivity(activity.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br p-3 transition-all",
                "h-24 sm:h-28",
                activity.gradient,
                selected
                  ? "ring-2 ring-lime-400 ring-offset-2 dark:ring-offset-slate-800"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {selected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-slate-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span className="text-3xl" role="img" aria-label={activity.label}>
                {activity.icon}
              </span>
              <span className="text-sm font-bold text-white">{activity.label}</span>
            </button>
          );
        })}
      </div>

      {/* All of the above */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            "rounded-full border px-5 py-2 text-sm font-medium transition-colors",
            allSelected
              ? "border-lime-500 bg-lime-500 text-slate-900"
              : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500",
          )}
        >
          All of the above
        </button>
      </div>

      {/* Experience level */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience Level</p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setExperienceLevel(experienceLevel === level ? null : level)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                experienceLevel === level
                  ? "border-lime-500 bg-lime-500 text-slate-900"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={activities.length === 0}
        className={cn(
          "w-full rounded-xl py-3 text-center font-semibold transition-colors",
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
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white sm:text-2xl">
          Tell us about yourself
        </h2>
      </div>

      {/* First name */}
      <Input
        id="quiz-name"
        label="First Name"
        placeholder="Your first name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      {/* Age range */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Age Range</p>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setAgeRange(ageRange === range ? null : range)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                ageRange === range
                  ? "border-lime-500 bg-lime-500 text-slate-900"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <Input
        id="quiz-location"
        label="Location"
        placeholder="e.g., Iloilo City"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 rounded-xl bg-lime-500 py-3 text-center font-semibold text-slate-900 transition-colors hover:bg-lime-400"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStepDiscovery = () => (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white sm:text-2xl">
          How did you discover EventTara?
        </h2>
      </div>

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {DISCOVERY_SOURCES.map((source) => {
          const selected = discoverySource === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setDiscoverySource(selected ? null : source.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                selected
                  ? "border-lime-500 bg-lime-50 dark:bg-lime-950/30"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
              )}
            >
              <span className="text-xl" role="img" aria-label={source.label}>
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

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!discoverySource}
          className={cn(
            "flex-1 rounded-xl py-3 text-center font-semibold transition-colors",
            discoverySource
              ? "bg-lime-500 text-slate-900 hover:bg-lime-400"
              : "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-slate-600 dark:text-slate-400",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStepGetStarted = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white sm:text-2xl">
          You&apos;re all set!
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ready to find your next adventure?
        </p>
      </div>

      {/* Value props */}
      <div className="space-y-3">
        {VALUE_PROPS.map((prop) => (
          <div key={prop} className="flex items-center gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime-100 dark:bg-lime-900/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-lime-600 dark:text-lime-400"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{prop}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void handleCreateAccount()}
          className="w-full rounded-xl bg-lime-500 py-3 font-semibold text-slate-900 transition-colors hover:bg-lime-400"
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => void handleContinueAsGuest()}
          className="w-full text-center text-sm text-gray-500 underline transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[85] flex items-center justify-center p-4 transition-opacity duration-200",
        isVisible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-quiz-title"
      onClick={handleDismiss}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 dark:bg-slate-800 sm:p-8",
          "max-h-[90vh] overflow-y-auto",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Skip button */}
        <button
          type="button"
          onClick={() => void handleSkip()}
          className="absolute right-4 top-4 text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          Skip
        </button>

        {/* Step indicator + progress bar */}
        <p className="mb-1 text-xs text-gray-400">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </p>
        <div className="mb-6 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1 rounded-full bg-lime-500 transition-all duration-300"
            style={{ width: `${String(((currentStep + 1) / TOTAL_STEPS) * 100)}%` }}
          />
        </div>

        {/* Step content with opacity transition */}
        <div className="transition-opacity duration-200">
          {currentStep === 0 && renderStepActivities()}
          {currentStep === 1 && renderStepAboutYou()}
          {currentStep === 2 && renderStepDiscovery()}
          {currentStep === 3 && renderStepGetStarted()}
        </div>
      </div>
    </div>
  );
}
