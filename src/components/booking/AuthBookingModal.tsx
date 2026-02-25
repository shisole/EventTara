"use client";

import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button, OtpCodeInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { generateUsername } from "@/lib/utils/generate-username";

type ModalState = "email" | "verify-code" | "success";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

interface AuthBookingModalProps {
  eventName: string;
  eventId: string;
  onAuthenticated: (userEmail: string) => void;
}

export default function AuthBookingModal({
  eventName,
  eventId,
  onAuthenticated,
}: AuthBookingModalProps) {
  const router = useRouter();
  const [state, setState] = useState<ModalState>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(emptyCode());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userDisplay, setUserDisplay] = useState("");

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Success: fire confetti and auto-close
  useEffect(() => {
    if (state !== "success") return;

    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#84cc16", "#22d3ee", "#fbbf24", "#f472b6"],
    });

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onAuthenticated(userDisplay);
      }, 200);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [state, userDisplay, onAuthenticated]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
      });

      if (otpError) {
        if (otpError.message?.includes("rate")) {
          setError("Too many attempts. Try again in a few minutes.");
        } else {
          setError(otpError.message || "Something went wrong. Please try again.");
        }
        return;
      }

      setUserDisplay(trimmed);
      setState("verify-code");
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
        email: userDisplay,
        token,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setCode(emptyCode());
        return;
      }

      if (data.user) {
        await generateUsername(supabase, data.user.id, userDisplay);
      }

      const displayName = data.user?.user_metadata?.full_name || data.user?.email || userDisplay;
      setUserDisplay(displayName);
      setState("success");
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: userDisplay,
      });
      if (otpError) {
        if (otpError.message?.includes("rate")) {
          setError("Too many attempts. Try again in a few minutes.");
        } else {
          setError(otpError.message || "Something went wrong. Please try again.");
        }
      } else {
        setCode(emptyCode());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {state !== "success" && (
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {state === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-lime-600 dark:text-lime-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2
                id="auth-modal-title"
                className="text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                Sign in to continue booking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{eventName}</p>
            </div>

            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Sending code..." : "Continue"}
            </Button>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              We&apos;ll send a 6-digit code to your email. Works for new and existing accounts.
            </p>
          </form>
        )}

        {state === "verify-code" && (
          <OtpCodeInput
            email={userDisplay}
            code={code}
            onCodeChange={(newCode) => {
              setCode(newCode);
              setError("");
            }}
            onSubmit={handleVerifyCode}
            onResend={handleResend}
            onChangeEmail={() => {
              setError("");
              setCode(emptyCode());
              setState("email");
            }}
            loading={loading}
            error={error}
          />
        )}

        {state === "success" && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-lime-600 dark:text-lime-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome,{" "}
              <span className="font-medium text-gray-900 dark:text-white">{userDisplay}</span>!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
