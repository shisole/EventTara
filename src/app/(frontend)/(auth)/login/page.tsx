"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CheckCircleIcon, GoogleIcon, StravaIcon } from "@/components/icons";
import { Button, Input, OtpCodeInput } from "@/components/ui";
import { STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/lib/strava/constants";
import { createClient } from "@/lib/supabase/client";
import { generateUsername } from "@/lib/utils/generate-username";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

type LoginState = "form" | "verify-code" | "success";
type AuthMethod = "password" | "otp";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/events";
  const supabase = createClient();
  const [state, setState] = useState<LoginState>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");

  // OTP code state
  const [code, setCode] = useState<string[]>(emptyCode());
  const [oauthGoogle, setOauthGoogle] = useState(false);
  const [oauthStrava, setOauthStrava] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d: { oauthGoogle?: boolean; oauthStrava?: boolean }) => {
        setOauthGoogle(d.oauthGoogle === true);
        setOauthStrava(d.oauthStrava === true);
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) router.replace("/");
    });
  }, [supabase, router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signInError) {
        setError("Invalid email or password.");
        return;
      }

      setState("success");
      setTimeout(() => {
        router.push(next);
        router.refresh();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
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
        await generateUsername(supabase, data.user.id, email);
      }

      setState("success");

      setTimeout(() => {
        router.push(next);
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
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

  const handleGuestContinue = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
    } else {
      router.push("/guest-setup");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
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
            setState("form");
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
            Welcome back!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-center">Welcome Back!</h2>

      <div className="space-y-3">
        {oauthGoogle ? (
          <Button
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
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
        )}

        {
          <>
            {oauthStrava ? (
              <Button disabled className="w-full bg-[#FC4C02]/60 cursor-not-allowed" size="lg">
                <StravaIcon className="w-5 h-5 mr-2" />
                Continue with Strava
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  Coming Soon
                </span>
              </Button>
            ) : (
              <Button
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
                    state: JSON.stringify({ flow: "login", returnUrl: next }),
                    approval_prompt: "auto",
                  });
                  globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
                }}
              >
                <StravaIcon className="w-5 h-5 mr-2" />
                Continue with Strava
              </Button>
            )}

            <button
              onClick={handleGuestContinue}
              className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
              Continue as Guest
            </button>
          </>
        }
      </div>

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

      <form onSubmit={authMethod === "password" ? handlePasswordLogin : handleOtpSubmit}>
        <fieldset disabled={loading} className="min-w-0 space-y-4">
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

          {authMethod === "password" && (
            <>
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
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
        <Link
          href={next === "/events" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`}
          className="text-lime-600 dark:text-lime-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
