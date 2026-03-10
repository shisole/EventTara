"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { GoogleIcon, StravaIcon } from "@/components/icons";
import { Button, Input, OtpCodeInput } from "@/components/ui";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { isReservedUsername } from "@/lib/constants/reserved-usernames";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { generateUsername } from "@/lib/utils/generate-username";

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;
const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

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
type AuthPanel = "hidden" | "signup" | "login";
type AuthMethod = "password" | "otp";
type AuthStep = "form" | "verify-code";

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

// ---------------------------------------------------------------------------
// Inline Auth Form
// ---------------------------------------------------------------------------

function InlineAuthForm({
  mode,
  onSwitchMode,
  onAuthSuccess,
  welcomeCode,
}: {
  mode: "signup" | "login";
  onSwitchMode: () => void;
  onAuthSuccess: () => void;
  welcomeCode: string;
}) {
  const supabase = createClient();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [authStep, setAuthStep] = useState<AuthStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMoreAuth, setShowMoreAuth] = useState(false);

  // Feature flags
  const [oauthGoogle, setOauthGoogle] = useState(false);
  const [oauthStrava, setOauthStrava] = useState(false);
  const [oauthFacebook, setOauthFacebook] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState<string[]>(emptyCode());

  // Username validation
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "reserved"
  >("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metadataRef = useRef<Record<string, string>>({});

  const returnPath = `/welcome/${welcomeCode}`;

  useEffect(() => {
    void fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d: { oauthGoogle?: boolean; oauthStrava?: boolean; oauthFacebook?: boolean }) => {
        setOauthGoogle(d.oauthGoogle === true);
        setOauthStrava(d.oauthStrava === true);
        setOauthFacebook(d.oauthFacebook === true);
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, []);

  const checkUsername = useCallback((value: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
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
    usernameTimerRef.current = setTimeout(async () => {
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

  const handlePostSignup = async (userId: string) => {
    const trimmedName = fullName.trim();
    if (trimmedName) {
      await supabase.from("users").update({ full_name: trimmedName }).eq("id", userId);
    }
    const trimmedUsername = username.toLowerCase().trim();
    await (trimmedUsername && USERNAME_REGEX.test(trimmedUsername)
      ? supabase.from("users").update({ username: trimmedUsername }).eq("id", userId)
      : generateUsername(supabase, userId, email));
  };

  // --- OAuth handlers ---

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Something went wrong.");
      setGoogleLoading(false);
    }
  };

  const handleStravaAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) return;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
      response_type: "code",
      scope: STRAVA_SCOPES.join(","),
      state: JSON.stringify({ flow: "login", returnUrl: returnPath }),
      approval_prompt: "auto",
    });
    globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
  };

  // --- Signup handler ---

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    const trimmedUsername = username.toLowerCase().trim();
    if (trimmedUsername && !USERNAME_REGEX.test(trimmedUsername)) {
      setError(
        "Username must be 3-30 chars: lowercase letters, numbers, dots, underscores, hyphens.",
      );
      setLoading(false);
      return;
    }
    if (trimmedUsername && usernameStatus === "taken") {
      setError("That username is already taken.");
      setLoading(false);
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (authMethod === "password") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    const metadata = { full_name: fullName.trim() };
    metadataRef.current = metadata;

    try {
      if (authMethod === "password") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: metadata },
        });
        if (signupError) {
          setError(
            signupError.message?.includes("already registered")
              ? "This email is already registered. Try signing in instead."
              : signupError.message || "Something went wrong.",
          );
          return;
        }
        if (data.session && data.user) {
          await handlePostSignup(data.user.id);
          onAuthSuccess();
        } else {
          setAuthStep("verify-code");
        }
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: { data: metadata },
        });
        if (otpError) {
          setError(
            otpError.message?.includes("rate")
              ? "Too many attempts. Try again in a few minutes."
              : otpError.message || "Something went wrong.",
          );
          return;
        }
        setAuthStep("verify-code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Login handler ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      if (authMethod === "password") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError("Invalid email or password.");
          return;
        }
        onAuthSuccess();
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({ email: trimmedEmail });
        if (otpError) {
          setError(
            otpError.message?.includes("rate")
              ? "Too many attempts. Try again in a few minutes."
              : otpError.message || "Something went wrong.",
          );
          return;
        }
        setAuthStep("verify-code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- OTP verification ---

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = otpCode.join("");
    if (token.length !== CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: mode === "signup" && authMethod === "password" ? "signup" : "email",
      });
      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setOtpCode(emptyCode());
        return;
      }
      if (mode === "signup" && data.user) {
        await handlePostSignup(data.user.id);
      }
      onAuthSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signup" && authMethod === "password") {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
        });
        if (resendError) {
          setError(
            resendError.message?.includes("rate")
              ? "Too many attempts. Try again in a few minutes."
              : resendError.message || "Something went wrong.",
          );
        } else {
          setOtpCode(emptyCode());
        }
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          ...(mode === "signup" ? { options: { data: metadataRef.current } } : {}),
        });
        if (otpError) {
          setError(
            otpError.message?.includes("rate")
              ? "Too many attempts. Try again in a few minutes."
              : otpError.message || "Something went wrong.",
          );
        } else {
          setOtpCode(emptyCode());
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- OTP verification step ---
  if (authStep === "verify-code") {
    return (
      <div className="space-y-4">
        <OtpCodeInput
          email={email}
          code={otpCode}
          onCodeChange={(newCode) => {
            setOtpCode(newCode);
            setError("");
          }}
          onSubmit={handleVerifyCode}
          onResend={handleResend}
          onChangeEmail={() => {
            setError("");
            setOtpCode(emptyCode());
            setAuthStep("form");
          }}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  // --- OAuth buttons ---
  const oauthSection = (
    <div className="space-y-3">
      {oauthGoogle ? (
        <Button disabled className="w-full bg-white/60 cursor-not-allowed border border-gray-300">
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
          <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
            Coming Soon
          </span>
        </Button>
      ) : (
        <Button
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </Button>
      )}

      {showMoreAuth && (
        <div className="space-y-3">
          {oauthFacebook ? (
            <Button disabled className="w-full bg-[#1877F2]/60 cursor-not-allowed">
              Continue with Facebook
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                Coming Soon
              </span>
            </Button>
          ) : (
            <Button className="w-full bg-[#1877F2] hover:bg-[#1565C0] text-white" disabled>
              Continue with Facebook
            </Button>
          )}

          {oauthStrava ? (
            <Button disabled className="w-full bg-[#FC4C02]/60 cursor-not-allowed">
              <StravaIcon className="w-5 h-5 mr-2" />
              Continue with Strava
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                Coming Soon
              </span>
            </Button>
          ) : (
            <Button
              className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
              onClick={handleStravaAuth}
            >
              <StravaIcon className="w-5 h-5 mr-2" />
              Continue with Strava
            </Button>
          )}
        </div>
      )}

      {!showMoreAuth && (
        <button
          type="button"
          onClick={() => setShowMoreAuth(true)}
          className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          More {mode === "signup" ? "sign-up" : "sign-in"} options
        </button>
      )}
    </div>
  );

  // --- Divider ---
  const divider = (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white dark:bg-gray-900 px-4 text-gray-400 dark:text-gray-500">or</span>
      </div>
    </div>
  );

  // --- Signup form ---
  if (mode === "signup") {
    return (
      <div className="space-y-5">
        {oauthSection}
        {divider}

        <form onSubmit={handleSignup}>
          <fieldset disabled={loading} className="min-w-0 space-y-4">
            <Input
              id="welcome-fullName"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
              required
            />

            {/* Username */}
            <div className="space-y-1">
              <label
                htmlFor="welcome-username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm select-none pointer-events-none">
                  @
                </span>
                <input
                  id="welcome-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replaceAll(/[^a-z0-9._-]/g, "");
                    setUsername(val);
                    checkUsername(val);
                  }}
                  placeholder="your.username"
                  maxLength={30}
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
              {usernameStatus === "idle" && username.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Optional — one will be generated if left blank
                </p>
              )}
            </div>

            <Input
              id="welcome-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {/* Password fields */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                authMethod === "password"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-4">
                  <Input
                    id="welcome-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required={authMethod === "password"}
                    minLength={6}
                  />
                  <Input
                    id="welcome-confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required={authMethod === "password"}
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(authMethod === "password" ? "otp" : "password");
                  setError("");
                }}
                className="text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
              >
                {authMethod === "password" ? "Use code instead" : "Use password instead"}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full min-h-[48px]" size="lg" disabled={loading}>
              {loading
                ? authMethod === "password"
                  ? "Creating account..."
                  : "Sending code..."
                : "Create Account & Claim"}
            </Button>

            {authMethod === "otp" && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                We&apos;ll send a 6-digit code to your email to verify your account.
              </p>
            )}
          </fieldset>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
          >
            Log in
          </button>
        </p>
      </div>
    );
  }

  // --- Login form ---
  return (
    <div className="space-y-5">
      {oauthSection}
      {divider}

      <form onSubmit={handleLogin}>
        <fieldset disabled={loading} className="min-w-0 space-y-4">
          <Input
            id="welcome-login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          {authMethod === "password" && (
            <>
              <Input
                id="welcome-login-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full min-h-[48px]" size="lg" disabled={loading}>
            {loading
              ? authMethod === "password"
                ? "Signing in..."
                : "Sending code..."
              : authMethod === "password"
                ? "Sign In & Claim"
                : "Send Code"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMethod(authMethod === "password" ? "otp" : "password");
                setError("");
              }}
              className="text-sm text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
            >
              {authMethod === "password"
                ? "Sign in with code instead"
                : "Sign in with password instead"}
            </button>
          </div>

          {authMethod === "otp" && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              We&apos;ll send a 6-digit code to your email.
            </p>
          )}
        </fieldset>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Welcome Client
// ---------------------------------------------------------------------------

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
  const [state, setState] = useState<ViewState>(hasClaimed ? "already-claimed" : "welcome");
  const [authPanel, setAuthPanel] = useState<AuthPanel>("hidden");
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

  function handleAuthSuccess() {
    void handleClaim();
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
          ) : authPanel === "hidden" ? (
            <div className="space-y-3">
              <Button
                onClick={() => setAuthPanel("signup")}
                className="w-full min-h-[48px]"
                size="lg"
              >
                Sign Up to Claim
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthPanel("login")}
                  className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
                >
                  Log in
                </button>
              </p>
            </div>
          ) : (
            <div className="mt-2 text-left">
              <InlineAuthForm
                mode={authPanel}
                onSwitchMode={() => setAuthPanel(authPanel === "signup" ? "login" : "signup")}
                onAuthSuccess={handleAuthSuccess}
                welcomeCode={code}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
