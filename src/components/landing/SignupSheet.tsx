"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon, GoogleIcon, StravaIcon } from "@/components/icons";
import { Button, OtpCodeInput } from "@/components/ui";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignupSheetProps {
  open: boolean;
  onClose: () => void;
  returnUrl?: string;
}

type View = "options" | "email" | "otp";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

export default function SignupSheet({ open, onClose, returnUrl = "/" }: SignupSheetProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("options");
  const [oauthGoogleDisabled, setOauthGoogleDisabled] = useState(false);
  const [oauthStravaDisabled, setOauthStravaDisabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(emptyCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const goBack = () => {
    setError("");
    setView(view === "otp" ? "email" : "options");
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    if (view === "options") return;
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (dx > 60 && Math.abs(dy) < 60) goBack();
  };

  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    setDragging(true);
  };
  const handleDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    setDragY(Math.max(0, clientY - dragStartY.current));
  };
  const handleDragEnd = () => {
    if (dragStartY.current === null) return;
    const shouldClose = dragY > 100;
    dragStartY.current = null;
    setDragging(false);
    setDragY(0);
    if (shouldClose) onClose();
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setView("options");
        setEmail("");
        setCode(emptyCode());
        setError("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  useEffect(() => {
    void fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d: { oauthGoogle?: boolean; oauthStrava?: boolean }) => {
        setOauthGoogleDisabled(d.oauthGoogle === true);
        setOauthStravaDisabled(d.oauthStrava === true);
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleStrava = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) return;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
      response_type: "code",
      scope: STRAVA_SCOPES.join(","),
      state: JSON.stringify({ flow: "login", returnUrl }),
      approval_prompt: "auto",
    });
    globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: trimmed });
      if (otpError) {
        setError(
          otpError.message?.includes("rate")
            ? "Too many attempts. Try again in a few minutes."
            : otpError.message || "Something went wrong. Please try again.",
        );
        return;
      }
      setView("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = code.join("");
    if (token.length !== CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setCode(emptyCode());
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("username")
          .eq("id", data.user.id)
          .single();
        if (!profile?.username) {
          router.push(`/setup-username?next=${encodeURIComponent(returnUrl)}`);
          return;
        }
      }
      router.push(returnUrl);
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
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (otpError) {
        setError(
          otpError.message?.includes("rate")
            ? "Too many attempts. Try again in a few minutes."
            : otpError.message || "Something went wrong. Please try again.",
        );
      } else {
        setCode(emptyCode());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const trackIndex = view === "options" ? 0 : view === "email" ? 1 : 2;

  const sheet = (
    <div
      className="fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-sheet-title"
    >
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-white dark:bg-slate-800 shadow-2xl pb-[env(safe-area-inset-bottom,0px)] overflow-clip",
          dragging ? "" : "transition-transform duration-300 ease-out",
        )}
        style={{
          transform: visible ? `translateY(${dragY}px)` : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onPointerDown={(e) => {
            if (e.pointerType === "touch") return;
            e.currentTarget.setPointerCapture(e.pointerId);
            handleDragStart(e.clientY);
          }}
          onPointerMove={(e) => {
            if (dragStartY.current === null) return;
            handleDragMove(e.clientY);
          }}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {view !== "options" && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="absolute top-3 left-3 z-10 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Sliding track */}
        <div
          className="relative overflow-clip"
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          <div
            className="flex w-[300%] transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${trackIndex * (100 / 3)}%)` }}
          >
            {/* View 1: Options */}
            <div className="w-1/3 shrink-0 px-6 pt-4 pb-8 space-y-5">
              <h2
                id="signup-sheet-title"
                className="text-center text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                Sign up
              </h2>

              <div className="space-y-3">
                <Button
                  className="w-full rounded-full min-h-[52px] bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-600 text-base font-semibold"
                  onClick={handleGoogle}
                  disabled={oauthGoogleDisabled || googleLoading}
                >
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  {googleLoading ? "Redirecting..." : "Continue with Google"}
                  {oauthGoogleDisabled && (
                    <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Soon
                    </span>
                  )}
                </Button>

                <Button
                  className="w-full rounded-full min-h-[52px] bg-[#FC4C02] hover:bg-[#E34402] text-white text-base font-semibold"
                  onClick={handleStrava}
                  disabled={oauthStravaDisabled}
                >
                  <StravaIcon className="w-5 h-5 mr-2" />
                  Continue with Strava
                  {oauthStravaDisabled && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                      Soon
                    </span>
                  )}
                </Button>
              </div>

              {view === "options" && error && (
                <p className="text-sm text-red-500 text-center" role="alert">
                  {error}
                </p>
              )}

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-slate-800 px-4 text-gray-400 dark:text-gray-500">
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setView("email");
                }}
                className="block w-full text-center text-base font-semibold text-gray-900 dark:text-white hover:text-lime-600 dark:hover:text-lime-400"
              >
                Sign up with email
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(returnUrl)}`}
                  className="text-lime-600 dark:text-lime-400 font-semibold hover:text-lime-700 dark:hover:text-lime-300"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* View 2: Email */}
            <div className="w-1/3 shrink-0 px-6 pt-4 pb-8">
              <form onSubmit={handleSendCode} className="space-y-5">
                <h2 className="text-center text-xl font-heading font-bold text-gray-900 dark:text-white">
                  Sign up with email
                </h2>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  We&apos;ll send a 6-digit code to your email.
                </p>

                <div>
                  <label
                    htmlFor="signup-sheet-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="signup-sheet-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>

                {view === "email" && error && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-full min-h-[52px] text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Sending code..." : "Send Code"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setView("options");
                  }}
                  className="block w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Back
                </button>
              </form>
            </div>

            {/* View 3: OTP */}
            <div className="w-1/3 shrink-0 px-6 pt-4 pb-8">
              {view === "otp" && (
                <OtpCodeInput
                  email={email}
                  code={code}
                  onCodeChange={(c) => {
                    setCode(c);
                    setError("");
                  }}
                  onSubmit={handleVerifyCode}
                  onResend={handleResend}
                  onChangeEmail={() => {
                    setError("");
                    setCode(emptyCode());
                    setView("email");
                  }}
                  loading={loading}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
