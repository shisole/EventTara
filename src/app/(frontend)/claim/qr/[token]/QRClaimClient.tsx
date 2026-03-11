"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface QRClaimClientProps {
  token: string;
  serialNumber: number;
  batchQuantity: number;
  batchName: string;
  badge: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string;
    rarity: string;
  };
  isClaimed: boolean;
}

const rarityGlow: Record<string, string> = {
  common: "ring-gray-300 dark:ring-gray-600",
  rare: "ring-blue-400 dark:ring-blue-500 shadow-blue-200 dark:shadow-blue-900/40",
  epic: "ring-purple-400 dark:ring-purple-500 shadow-purple-200 dark:shadow-purple-900/40",
  legendary: "ring-amber-400 dark:ring-amber-500 shadow-amber-200 dark:shadow-amber-900/40",
};

const rarityLabel: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  epic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function QRClaimClient({
  token,
  serialNumber,
  batchQuantity,
  batchName,
  badge,
  isClaimed,
}: QRClaimClientProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyHadBadge, setAlreadyHadBadge] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setCheckingAuth(false);
    }
    void checkAuth();
  }, []);

  async function handleClaim() {
    setClaiming(true);
    setError("");

    try {
      const res = await fetch(`/api/qr-claim/${token}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to claim badge");
        setClaiming(false);
        return;
      }

      setAlreadyHadBadge(!!data.already_had_badge);
      setSuccess(true);

      // Fire confetti
      if (!confettiFired.current) {
        confettiFired.current = true;
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

      setTimeout(() => {
        router.push("/achievements");
      }, 3000);
    } catch {
      setError("Network error. Please try again.");
      setClaiming(false);
    }
  }

  // Already claimed state
  if (isClaimed) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            className="h-8 w-8 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Already Redeemed</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This QR code has already been used to claim a badge.
        </p>
        <Link
          href="/achievements"
          className="inline-block rounded-xl bg-lime-500 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-lime-400"
        >
          View Achievements
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-4 text-center">
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {alreadyHadBadge ? "Code Redeemed!" : "Badge Claimed!"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {alreadyHadBadge
            ? `You already have the "${badge.title}" badge, but this code has been registered to your account.`
            : `You earned the "${badge.title}" badge!`}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to achievements...</p>
      </div>
    );
  }

  // Loading state
  if (checkingAuth) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  // Badge preview + claim/login
  return (
    <div className="space-y-6 text-center">
      {/* Badge image */}
      <div className="flex flex-col items-center gap-3">
        {badge.image_url ? (
          <div
            className={cn(
              "overflow-hidden rounded-2xl ring-4 shadow-lg",
              rarityGlow[badge.rarity] ?? rarityGlow.common,
            )}
          >
            <Image
              src={badge.image_url}
              alt={badge.title}
              width={160}
              height={160}
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-40 w-40 items-center justify-center rounded-2xl bg-gray-100 ring-4 dark:bg-gray-800",
              rarityGlow[badge.rarity] ?? rarityGlow.common,
            )}
          >
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
        )}

        <span
          className={cn(
            "inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize",
            rarityLabel[badge.rarity] ?? rarityLabel.common,
          )}
        >
          {badge.rarity}
        </span>
      </div>

      {/* Badge info */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{badge.title}</h1>
        {badge.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
        )}
      </div>

      {/* Serial number */}
      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
        <p className="text-lg font-heading font-bold text-gray-900 dark:text-white">
          #{serialNumber} of {batchQuantity}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{batchName}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Action */}
      {userId ? (
        <Button onClick={handleClaim} disabled={claiming} className="w-full">
          {claiming ? "Claiming..." : "Claim Badge"}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Log in to claim this badge</p>
          <Link
            href={`/login?redirect=/claim/qr/${token}`}
            className="inline-block w-full rounded-xl bg-lime-500 px-6 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-lime-400"
          >
            Log in to Claim
          </Link>
        </div>
      )}
    </div>
  );
}
