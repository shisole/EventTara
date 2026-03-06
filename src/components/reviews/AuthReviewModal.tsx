"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CheckCircleIcon, CloseIcon, EnvelopeIcon } from "@/components/icons";
import { Button, OtpCodeInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { generateUsername } from "@/lib/utils/generate-username";

type ModalState = "form" | "verify-code" | "success";
type AuthMethod = "password" | "otp";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

async function fetchUserProfile(
  userId: string,
  fallbackName: string,
): Promise<{ id: string; fullName: string }> {
  const supabase = createClient();
  const { data } = await supabase.from("users").select("full_name").eq("id", userId).single();

  return {
    id: userId,
    fullName: data?.full_name || fallbackName,
  };
}

interface AuthReviewModalProps {
  organizerName: string;
  onAuthenticated: (user: { id: string; fullName: string }) => void;
  onClose: () => void;
}

export default function AuthReviewModal({
  organizerName,
  onAuthenticated,
  onClose,
}: AuthReviewModalProps) {
  const [state, setState] = useState<ModalState>("form");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState<string[]>(emptyCode());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userDisplay, setUserDisplay] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "success") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, state]);

  // Success: auto-close after 1500ms (no confetti)
  useEffect(() => {
    if (state !== "success" || !authenticatedUser) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onAuthenticated(authenticatedUser);
      }, 200);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [state, authenticatedUser, onAuthenticated]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signInError) {
        setError("Invalid email or password.");
        return;
      }

      const displayName = data.user?.user_metadata?.full_name || data.user?.email || trimmed;
      setUserDisplay(displayName);

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, displayName);
        setAuthenticatedUser(profile);
        setState("success");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
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

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id, displayName);
        setAuthenticatedUser(profile);
        setState("success");
      } else {
        setError("Something went wrong. Please try again.");
      }
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

  const inputClassName =
    "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-review-modal-title"
      onClick={onClose}
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
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}

        {state === "form" && (
          <form
            onSubmit={authMethod === "password" ? handlePasswordLogin : handleOtpSubmit}
            className="space-y-5"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h2
                id="auth-review-modal-title"
                className="text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                Sign in to leave your review
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{organizerName}</p>
            </div>

            <div>
              <label
                htmlFor="auth-review-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="auth-review-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="you@example.com"
                autoFocus
                className={inputClassName}
              />
            </div>

            {authMethod === "password" && (
              <div>
                <label
                  htmlFor="auth-review-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="auth-review-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  placeholder="Enter your password"
                  className={inputClassName}
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? authMethod === "password"
                  ? "Signing in..."
                  : "Sending code..."
                : authMethod === "password"
                  ? "Sign In"
                  : "Send Code"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(authMethod === "password" ? "otp" : "password");
                  setError("");
                }}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                {authMethod === "password"
                  ? "Use a one-time code instead"
                  : "Sign in with password instead"}
              </button>
            </div>

            {authMethod === "otp" && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                We&apos;ll send a 6-digit code to your email. Works for new and existing accounts.
              </p>
            )}
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
              setState("form");
            }}
            loading={loading}
            error={error}
          />
        )}

        {state === "success" && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
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
