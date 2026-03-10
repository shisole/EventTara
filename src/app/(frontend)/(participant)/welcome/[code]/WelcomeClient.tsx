"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface BadgeInfo {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface WelcomeClientProps {
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  heroImageUrl: string | null;
  redirectUrl: string;
  badge: BadgeInfo | null;
  spotsRemaining: number | null;
  isLoggedIn: boolean;
  hasClaimed: boolean;
}

type ViewState = "welcome" | "claiming" | "celebration" | "already-claimed" | "error";

function fireConfetti() {
  const colors = ["#a3e635", "#22d3ee", "#f59e0b", "#ec4899", "#8b5cf6"];
  void confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors });
  const end = Date.now() + 2500;
  const frame = () => {
    void confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    void confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function BadgePreview({ badge, size = "md" }: { badge: BadgeInfo; size?: "md" | "lg" }) {
  const resolved = resolvePresetImage(badge.image_url);
  const rarityStyle = RARITY_STYLES[badge.rarity];
  const sizeClasses = size === "lg" ? "w-28 h-28" : "w-20 h-20";
  const textSize = size === "lg" ? "text-5xl" : "text-3xl";

  return (
    <div
      className={cn(
        "mx-auto rounded-full flex items-center justify-center overflow-hidden",
        sizeClasses,
        resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
        rarityStyle.ring,
        rarityStyle.glow,
      )}
    >
      {resolved?.type === "url" ? (
        <Image
          src={resolved.url}
          alt={badge.title}
          width={size === "lg" ? 112 : 80}
          height={size === "lg" ? 112 : 80}
          className="object-cover"
        />
      ) : (
        <span className={textSize}>
          {resolved?.type === "emoji" ? resolved.emoji : "\u{1F3C6}"}
        </span>
      )}
    </div>
  );
}

export default function WelcomeClient({
  code,
  title,
  subtitle,
  description,
  heroImageUrl,
  redirectUrl,
  badge,
  spotsRemaining,
  isLoggedIn,
  hasClaimed,
}: WelcomeClientProps) {
  const pathname = usePathname();
  const [state, setState] = useState<ViewState>(hasClaimed ? "already-claimed" : "welcome");
  const [errorMsg, setErrorMsg] = useState("");
  const confettiFired = useRef(false);

  async function handleClaim() {
    setState("claiming");
    try {
      const res = await fetch(`/api/welcome/${code}/claim`, { method: "POST" });
      const data: { error?: string; success?: boolean } = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setState("already-claimed");
          return;
        }
        setErrorMsg(data.error ?? "Something went wrong");
        setState("error");
        return;
      }

      setState("celebration");
      if (!confettiFired.current) {
        confettiFired.current = true;
        fireConfetti();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  // ---------- Already Claimed ----------
  if (state === "already-claimed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
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
          <h1 className="font-heading text-2xl font-bold mb-2">Already Claimed</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You&apos;ve already claimed this reward. Enjoy your badge!
          </p>
          {badge && (
            <div className="mb-6">
              <BadgePreview badge={badge} />
              <p className="font-heading font-bold mt-3">{badge.title}</p>
            </div>
          )}
          <Link
            href={redirectUrl}
            className="inline-flex items-center justify-center font-semibold rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-900 py-3 px-6 min-h-[48px] transition-colors"
          >
            Continue Exploring
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Celebration ----------
  if (state === "celebration") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fadeUp">
          {badge && (
            <div className="mb-6">
              <BadgePreview badge={badge} size="lg" />
            </div>
          )}
          <h1 className="font-heading text-3xl font-bold mb-2">Badge Unlocked!</h1>
          {badge && (
            <>
              <p className="font-heading text-xl font-semibold text-golden-600 dark:text-golden-400 mb-1">
                {badge.title}
              </p>
              {badge.description && (
                <p className="text-gray-500 dark:text-gray-400 mb-2">{badge.description}</p>
              )}
              <span
                className={cn(
                  "inline-block text-xs px-2.5 py-0.5 rounded-full mb-6",
                  RARITY_STYLES[badge.rarity].pill,
                )}
              >
                {RARITY_STYLES[badge.rarity].label}
              </span>
            </>
          )}
          <div>
            <Link
              href={redirectUrl}
              className="inline-flex items-center justify-center font-semibold rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-900 py-3 px-6 min-h-[48px] transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Error ----------
  if (state === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
          <Button onClick={() => setState("welcome")} className="min-h-[48px]">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Welcome (default) ----------
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
        {/* Hero image */}
        {heroImageUrl && (
          <div className="relative h-48 w-full">
            <Image src={heroImageUrl} alt={title} fill className="object-cover" priority />
          </div>
        )}

        <div className="p-8 text-center">
          {/* Title & subtitle */}
          <h1 className="font-heading text-2xl font-bold mb-2">{title}</h1>
          {subtitle && <p className="text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
          )}

          {/* Badge preview */}
          {badge && (
            <div className="mb-6">
              <BadgePreview badge={badge} />
              <p className="font-heading font-bold mt-3">{badge.title}</p>
              {badge.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
              )}
              <span
                className={cn(
                  "inline-block text-xs px-2.5 py-0.5 rounded-full mt-2",
                  RARITY_STYLES[badge.rarity].pill,
                )}
              >
                {RARITY_STYLES[badge.rarity].label}
              </span>
            </div>
          )}

          {/* Spots remaining */}
          {spotsRemaining !== null && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-4">
              {spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} remaining
            </p>
          )}

          {/* CTA */}
          {isLoggedIn ? (
            <Button
              onClick={handleClaim}
              disabled={state === "claiming"}
              className="w-full min-h-[48px]"
            >
              {state === "claiming" ? "Claiming..." : "Claim Your Reward"}
            </Button>
          ) : (
            <Link
              href={`/signup?next=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center justify-center w-full font-semibold rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-900 py-3 px-6 min-h-[48px] transition-colors"
            >
              Sign Up to Claim
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
