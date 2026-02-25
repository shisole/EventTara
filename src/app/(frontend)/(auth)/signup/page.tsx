"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";

import { CheckCircleIcon } from "@/components/icons";
import { Button, Input, OtpCodeInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { generateUsername } from "@/lib/utils/generate-username";

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

type SignupState = "details" | "verify-code" | "success";
type AuthMethod = "password" | "otp";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [state, setState] = useState<SignupState>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");

  // Username field
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isOrganizerEntry = searchParams.get("role") === "organizer";

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) router.replace("/");
    });
  }, [supabase, router]);

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

  // Organizer fields
  const [isOrganizer, setIsOrganizer] = useState(isOrganizerEntry);
  const [orgName, setOrgName] = useState("");

  // OTP code state
  const [code, setCode] = useState<string[]>(emptyCode());

  // Store metadata to apply after verification
  const metadataRef = useRef<Record<string, string>>({});

  const buildMetadata = () => {
    const metadata: Record<string, string> = { full_name: fullName.trim() };
    if (isOrganizer) {
      metadata.role = "organizer";
      metadata.org_name = orgName.trim();
    }
    return metadata;
  };

  const handlePostSignup = async (userId: string) => {
    const metadata = buildMetadata();

    if (metadata.full_name) {
      await supabase.from("users").update({ full_name: metadata.full_name }).eq("id", userId);
    }

    const trimmedUsername = username.toLowerCase().trim();
    await (trimmedUsername && USERNAME_REGEX.test(trimmedUsername)
      ? supabase.from("users").update({ username: trimmedUsername }).eq("id", userId)
      : generateUsername(supabase, userId, email));

    if (metadata.role === "organizer" && metadata.org_name) {
      await supabase.from("users").update({ role: "organizer" }).eq("id", userId);

      const { data: existingProfile } = await supabase
        .from("organizer_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!existingProfile) {
        await supabase
          .from("organizer_profiles")
          .insert({ user_id: userId, org_name: metadata.org_name });
      }
    }
  };

  const validateForm = () => {
    const trimmedUsername = username.toLowerCase().trim();
    if (trimmedUsername && !USERNAME_REGEX.test(trimmedUsername)) {
      setError(
        "Username must be 3-30 characters: lowercase letters, numbers, dots, underscores, or hyphens.",
      );
      return false;
    }
    if (trimmedUsername && usernameStatus === "taken") {
      setError("That username is already taken.");
      return false;
    }

    if (isOrganizer && !orgName.trim()) {
      setError("Organization name is required.");
      return false;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (authMethod === "password") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const metadata = buildMetadata();
    metadataRef.current = metadata;

    try {
      if (authMethod === "password") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: metadata },
        });

        if (signupError) {
          if (signupError.message?.includes("already registered")) {
            setError("This email is already registered. Try signing in instead.");
          } else {
            setError(signupError.message || "Something went wrong. Please try again.");
          }
          return;
        }

        if (data.session) {
          // Email confirmation not required — session is active immediately
          if (data.user) {
            await handlePostSignup(data.user.id);
          }
          setState("success");
          setTimeout(() => {
            router.push(isOrganizer ? "/dashboard" : "/events");
            router.refresh();
          }, 2000);
        } else {
          // Email confirmation required — show OTP verification screen
          setState("verify-code");
        }
      } else {
        // OTP flow
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { data: metadata },
        });

        if (otpError) {
          if (otpError.message?.includes("rate")) {
            setError("Too many attempts. Try again in a few minutes.");
          } else {
            setError(otpError.message || "Something went wrong. Please try again.");
          }
          return;
        }

        setState("verify-code");
      }
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
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: authMethod === "password" ? "signup" : "email",
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setCode(emptyCode());
        return;
      }

      if (data.user) {
        await handlePostSignup(data.user.id);
      }

      setState("success");

      setTimeout(() => {
        if (isOrganizer) {
          router.push("/dashboard");
        } else {
          router.push("/events");
        }
        router.refresh();
      }, 2000);
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
      if (authMethod === "password") {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
        });
        if (resendError) {
          if (resendError.message?.includes("rate")) {
            setError("Too many attempts. Try again in a few minutes.");
          } else {
            setError(resendError.message || "Something went wrong. Please try again.");
          }
        } else {
          setCode(emptyCode());
        }
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            data: metadataRef.current,
          },
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
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  if (state === "verify-code") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <OtpCodeInput
          email={email}
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
            setState("details");
          }}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-7 h-7 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
            You&apos;re all set!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome,{" "}
            <span className="font-medium text-gray-900 dark:text-white">{fullName || email}</span>!
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-center">
        {isOrganizerEntry ? "Host Your Events" : "Join the Adventure!"}
      </h2>
      {isOrganizerEntry && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Create an organizer account to start hosting outdoor adventures
        </p>
      )}

      <Button
        onClick={handleFacebookLogin}
        className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
        size="lg"
      >
        Continue with Facebook
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-4 text-gray-400 dark:text-gray-500">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          id="fullName"
          label="Full Name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
          }}
          placeholder="Juan Dela Cruz"
          required
        />
        <div className="space-y-1">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm select-none pointer-events-none">
              @
            </span>
            <input
              id="username"
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
                  : usernameStatus === "taken" || usernameStatus === "invalid"
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                    : "border-gray-300 dark:border-gray-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800",
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && (
                <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
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
              {usernameStatus === "taken" && (
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
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder="you@example.com"
          required
        />

        {/* Password fields (shown when password method is selected) */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            authMethod === "password" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4">
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder="At least 6 characters"
                required={authMethod === "password"}
                minLength={6}
              />
              <Input
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
                placeholder="Re-enter your password"
                required={authMethod === "password"}
              />
            </div>
          </div>
        </div>

        {/* Auth method toggle */}
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

        {/* Organizer toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none py-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={isOrganizer}
              onChange={(e) => {
                setIsOrganizer(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-lime-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            I want to organize events
          </span>
        </label>

        {/* Organizer fields */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOrganizer ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 pt-2 pb-1">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                  Set up your organizer profile
                </p>
              </div>

              <Input
                id="orgName"
                label="Organization Name"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                }}
                placeholder="e.g. Summit Trail Events"
                required={isOrganizer}
              />

              <p className="text-xs text-gray-400 dark:text-gray-500">
                You can add a logo and description later in your dashboard settings.
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading
            ? authMethod === "password"
              ? "Creating account..."
              : "Sending code..."
            : isOrganizer
              ? "Create Organizer Account"
              : "Create Account"}
        </Button>

        {authMethod === "otp" && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            We&apos;ll send a 6-digit code to your email to verify your account.
          </p>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-lime-600 dark:text-lime-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium"
        >
          Sign In
        </Link>
      </p>
      {isOrganizerEntry ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Just looking for events?{" "}
          <Link
            href="/signup"
            className="text-lime-600 dark:text-lime-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium"
          >
            Sign up as a participant
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Want to host events?{" "}
          <Link
            href="/signup?role=organizer"
            className="text-lime-600 dark:text-lime-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium"
          >
            Sign up as an organizer
          </Link>
        </p>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
