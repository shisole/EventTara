"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";

import { Button, Input, OtpCodeInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { generateUsername } from "@/lib/utils/generate-username";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

type SignupState = "details" | "verify-code" | "success";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [state, setState] = useState<SignupState>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isOrganizerEntry = searchParams.get("role") === "organizer";

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) router.replace("/");
    });
  }, [supabase, router]);

  // Organizer fields
  const [isOrganizer, setIsOrganizer] = useState(isOrganizerEntry);
  const [orgName, setOrgName] = useState("");

  // OTP code state
  const [code, setCode] = useState<string[]>(emptyCode());

  // Store metadata to apply after verification
  const metadataRef = useRef<Record<string, string>>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isOrganizer && !orgName.trim()) {
      setError("Organization name is required.");
      setLoading(false);
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // Store metadata for after verification
    const metadata: Record<string, string> = { full_name: fullName.trim() };
    if (isOrganizer) {
      metadata.role = "organizer";
      metadata.org_name = orgName.trim();
    }
    metadataRef.current = metadata;

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          data: metadata,
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

      // Update user profile with full name and username
      if (data.user) {
        const metadata = metadataRef.current;

        if (metadata.full_name) {
          await supabase
            .from("users")
            .update({ full_name: metadata.full_name })
            .eq("id", data.user.id);
        }

        await generateUsername(supabase, data.user.id, email);

        // Handle organizer profile creation
        if (metadata.role === "organizer" && metadata.org_name) {
          await supabase.from("users").update({ role: "organizer" }).eq("id", data.user.id);

          const { data: existingProfile } = await supabase
            .from("organizer_profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (!existingProfile) {
            await supabase
              .from("organizer_profiles")
              .insert({ user_id: data.user.id, org_name: metadata.org_name });
          }
        }
      }

      setState("success");

      // Redirect after brief delay
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
            ? "Sending code..."
            : isOrganizer
              ? "Create Organizer Account"
              : "Create Account"}
        </Button>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          We&apos;ll send a 6-digit code to your email to verify your account.
        </p>
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
