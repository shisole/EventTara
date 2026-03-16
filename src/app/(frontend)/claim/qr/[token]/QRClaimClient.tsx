"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { GoogleIcon, StravaIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";
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

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const claimRedirectUrl = `/claim/qr/${token}`;

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(claimRedirectUrl)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  function handleStravaSignup() {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) return;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
      response_type: "code",
      scope: STRAVA_SCOPES.join(","),
      state: JSON.stringify({ flow: "login", returnUrl: claimRedirectUrl }),
      approval_prompt: "auto",
    });
    globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
  }

  function fireConfetti() {
    if (confettiFired.current) return;
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

  async function handleClaim(e?: FormEvent) {
    if (e) e.preventDefault();
    setClaiming(true);
    setError("");

    try {
      const payload = userId
        ? { existing_user_id: userId }
        : { email, password, full_name: fullName };

      const res = await fetch(`/api/qr-claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to claim badge");
        setClaiming(false);
        return;
      }

      // If new user was created, sign them in
      if (data.is_new_user && email && password) {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Non-critical — badge was still claimed
          console.error("[qr-claim] Auto sign-in failed:", signInError.message);
        }
      }

      setAlreadyHadBadge(!!data.already_had_badge);
      setSuccess(true);
      fireConfetti();

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

  // Badge preview + claim/signup
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
        <Button onClick={() => handleClaim()} disabled={claiming} className="w-full">
          {claiming ? "Claiming..." : "Claim Badge"}
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Sign up to claim this badge
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <Button
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              size="lg"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <Button
              className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
              size="lg"
              onClick={handleStravaSignup}
            >
              <StravaIcon className="mr-2 h-5 w-5" />
              Continue with Strava
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleClaim}>
            <fieldset disabled={claiming} className="space-y-4 text-left">
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
                minLength={6}
                required
              />

              <Button type="submit" disabled={claiming} className="w-full">
                {claiming ? "Creating Account..." : "Create Account & Claim Badge"}
              </Button>
            </fieldset>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Already have an account?{" "}
            <Link
              href={`/login?redirect=/claim/qr/${token}`}
              className="text-teal-600 hover:underline dark:text-teal-400"
            >
              Log in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
