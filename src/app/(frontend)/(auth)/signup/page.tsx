"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isOrganizerEntry = searchParams.get("role") === "organizer";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) router.replace("/");
    });
  }, [supabase, router]);

  // Organizer fields
  const [isOrganizer, setIsOrganizer] = useState(isOrganizerEntry);
  const [orgName, setOrgName] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const metadata: Record<string, string> = { full_name: fullName };

    if (isOrganizer) {
      if (!orgName.trim()) {
        setError("Organization name is required.");
        setLoading(false);
        return;
      }
      metadata.role = "organizer";
      metadata.org_name = orgName.trim();
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else if (data.user && data.user.identities?.length === 0) {
      setError("This email is already registered.");
      setLoading(false);
    } else {
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
      router.refresh();
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

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
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Juan Dela Cruz"
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
          placeholder="At least 6 characters"
          minLength={6}
          required
        />

        {/* Organizer toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none py-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={isOrganizer}
              onChange={(e) => setIsOrganizer(e.target.checked)}
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
                onChange={(e) => setOrgName(e.target.value)}
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
            ? "Creating account..."
            : isOrganizer
              ? "Create Organizer Account"
              : "Create Account"}
        </Button>
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
