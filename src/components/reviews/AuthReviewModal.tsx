"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckCircleIcon,
  CloseIcon,
  EnvelopeIcon,
  GoogleIcon,
  StravaIcon,
} from "@/components/icons";
import { Button, OtpCodeInput } from "@/components/ui";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";
import { createClient } from "@/lib/supabase/client";
import { generateUsername } from "@/lib/utils/generate-username";

type ModalState = "form" | "verify-code" | "guest" | "success";
type AuthMethod = "password" | "otp";
type AuthMode = "login" | "signup";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const CODE_LENGTH = 6;
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;
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
  clubSlug: string;
  clubName: string;
  onAuthenticated: (user: { id: string; fullName: string; isGuest?: boolean }) => void;
  onClose: () => void;
}

export default function AuthReviewModal({
  clubSlug,
  clubName,
  onAuthenticated,
  onClose,
}: AuthReviewModalProps) {
  const [state, setState] = useState<ModalState>("form");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState<string[]>(emptyCode());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userDisplay, setUserDisplay] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [isGuestAuth, setIsGuestAuth] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [oauthGoogle, setOauthGoogle] = useState(false);
  const [oauthStrava, setOauthStrava] = useState(false);
  const [oauthFacebook, setOauthFacebook] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch OAuth feature flags
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

  // Check username availability
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

  // Success: auto-close after 1500ms (no confetti)
  useEffect(() => {
    if (state !== "success" || !authenticatedUser) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onAuthenticated({ ...authenticatedUser, isGuest: isGuestAuth });
      }, 200);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [state, authenticatedUser, isGuestAuth, onAuthenticated]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (authMethod === "password") {
      const trimmedUsername = username.trim().toLowerCase();
      if (!trimmedUsername) {
        setError("Please enter a username.");
        return;
      }
      if (!USERNAME_REGEX.test(trimmedUsername)) {
        setError(
          "Username must be 3-30 characters, lowercase, with only letters, numbers, dots, hyphens, or underscores.",
        );
        return;
      }
      if (usernameStatus === "taken") {
        setError("This username is already taken.");
        return;
      }
      if (usernameStatus === "checking" || usernameStatus === "idle") {
        setError("Please wait for username availability to be checked.");
        return;
      }
    }

    if (authMethod === "password") {
      if (!password || !confirmPassword) {
        setError("Please enter a password and confirm it.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (authMethod === "password") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (signUpError) {
          setError(signUpError.message || "Signup failed. Please try again.");
          return;
        }

        if (data.user) {
          // Set custom username if provided, otherwise generate one
          const usernameTrimmed = username.trim().toLowerCase();
          await (usernameTrimmed && usernameStatus === "available"
            ? supabase.from("users").update({ username: usernameTrimmed }).eq("id", data.user.id)
            : generateUsername(supabase, data.user.id, trimmedEmail));
          const profile = await fetchUserProfile(data.user.id, fullName.trim());
          setAuthenticatedUser(profile);
          setUserDisplay(fullName.trim());
          setState("success");
        } else {
          setError("Signup succeeded but no user was returned. Please try again.");
        }
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (otpError) {
          if (otpError.message?.includes("rate")) {
            setError("Too many attempts. Try again in a few minutes.");
          } else {
            setError(otpError.message || "Something went wrong. Please try again.");
          }
          return;
        }

        setUserDisplay(trimmedEmail);
        setState("verify-code");
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

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    // Check localStorage first
    const storageKey = `guestReview_club_${clubSlug}`;
    if (localStorage.getItem(storageKey)) {
      setError("You've already reviewed this club.");
      return;
    }

    // No sign-in needed — pass guest info directly to the parent
    setIsGuestAuth(true);
    setUserDisplay(trimmedName);
    setAuthenticatedUser({ id: "guest", fullName: trimmedName });
    setState("success");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  };

  const inputClassName =
    "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors";

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-end md:items-center justify-center md:p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-review-modal-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full md:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl p-6 md:p-8 max-h-[95dvh] overflow-y-auto transition-all duration-200 ${
          isVisible
            ? "opacity-100 translate-y-0 md:scale-100"
            : "opacity-0 translate-y-8 md:translate-y-0 md:scale-95"
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
            onSubmit={
              authMode === "signup"
                ? handleSignup
                : authMethod === "password"
                  ? handlePasswordLogin
                  : handleOtpSubmit
            }
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
                {authMode === "signup"
                  ? "Create account to review"
                  : "Sign in to leave your review"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{clubName}</p>
            </div>

            {/* OAuth buttons */}
            {oauthGoogle ? (
              <Button
                type="button"
                disabled
                className="w-full bg-white/60 cursor-not-allowed border border-gray-300"
                size="lg"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Continue with Google
                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
                  Coming Soon
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                size="lg"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </Button>
            )}

            {oauthFacebook ? (
              <Button
                type="button"
                disabled
                className="w-full bg-[#1877F2]/60 cursor-not-allowed"
                size="lg"
              >
                Continue with Facebook
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  Coming Soon
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full bg-[#1877F2] hover:bg-[#1565C0] text-white"
                size="lg"
                disabled
              >
                Continue with Facebook
              </Button>
            )}

            {oauthStrava ? (
              <Button
                type="button"
                disabled
                className="w-full bg-[#FC4C02]/60 cursor-not-allowed"
                size="lg"
              >
                <StravaIcon className="w-5 h-5 mr-2" />
                Continue with Strava
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  Coming Soon
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
                size="lg"
                onClick={() => {
                  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
                  if (!clientId) return;
                  const params = new URLSearchParams({
                    client_id: clientId,
                    redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
                    response_type: "code",
                    scope: STRAVA_SCOPES.join(","),
                    state: JSON.stringify({ flow: "login", returnUrl: "/events" }),
                    approval_prompt: "auto",
                  });
                  globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
                }}
              >
                <StravaIcon className="w-5 h-5 mr-2" />
                Continue with Strava
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-800 px-2 text-gray-400 dark:text-gray-500">
                  or
                </span>
              </div>
            </div>

            {authMode === "signup" && authMethod === "password" && (
              <>
                <div>
                  <label
                    htmlFor="auth-review-fullname"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="auth-review-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                    }}
                    placeholder="Your name"
                    autoFocus
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-review-username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Username
                    {usernameStatus === "checking" && (
                      <span className="ml-2 text-sm font-normal text-gray-500">Checking...</span>
                    )}
                    {usernameStatus === "available" && (
                      <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                        ✓ Available
                      </span>
                    )}
                    {usernameStatus === "taken" && (
                      <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
                        ✗ Taken
                      </span>
                    )}
                    {usernameStatus === "invalid" && (
                      <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
                        ✗ Invalid
                      </span>
                    )}
                  </label>
                  <input
                    id="auth-review-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      checkUsername(e.target.value);
                    }}
                    placeholder="3-30 characters, lowercase, letters/numbers/._-"
                    className={inputClassName}
                  />
                </div>
              </>
            )}

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
                autoFocus={authMode === "login"}
                className={inputClassName}
              />
            </div>

            {authMethod === "password" && (
              <>
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
                    placeholder={
                      authMode === "signup" ? "At least 8 characters" : "Enter your password"
                    }
                    className={inputClassName}
                  />
                  {authMode === "login" && (
                    <div className="flex justify-end mt-1.5">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </div>
                {authMode === "signup" && (
                  <div>
                    <label
                      htmlFor="auth-review-confirm-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Confirm password
                    </label>
                    <input
                      id="auth-review-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                      }}
                      placeholder="Confirm your password"
                      className={inputClassName}
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? authMode === "signup"
                  ? authMethod === "password"
                    ? "Creating account..."
                    : "Sending code..."
                  : authMethod === "password"
                    ? "Signing in..."
                    : "Sending code..."
                : authMode === "signup"
                  ? authMethod === "password"
                    ? "Create Account"
                    : "Send Code"
                  : authMethod === "password"
                    ? "Sign In"
                    : "Send Code"}
            </Button>

            <div className="space-y-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(authMethod === "password" ? "otp" : "password");
                  setError("");
                  setFullName("");
                  setUsername("");
                  setUsernameStatus("idle");
                  setConfirmPassword("");
                }}
                className="block w-full text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                {authMethod === "password"
                  ? authMode === "signup"
                    ? "Use email code instead"
                    : "Use a one-time code instead"
                  : authMode === "signup"
                    ? "Use password instead"
                    : "Sign in with password instead"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setError("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                  setUsername("");
                  setUsernameStatus("idle");
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {authMode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-800 px-2 text-gray-400 dark:text-gray-500">
                  or
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setState("guest");
              }}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Continue as Guest
            </button>

            {authMethod === "otp" && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                We&apos;ll send a 6-digit code to your email.
                {authMode === "signup" && " Works for new and existing accounts."}
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

        {state === "guest" && (
          <form onSubmit={handleGuestSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                What&apos;s your name?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This will be shown on your review for {clubName}
              </p>
            </div>

            <div>
              <label
                htmlFor="guest-review-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Your name
              </label>
              <input
                id="guest-review-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className={inputClassName}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setGuestName("");
                setState("form");
              }}
              className="block w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-center"
            >
              Back to sign in
            </button>
          </form>
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
