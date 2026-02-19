"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { PRESET_ORG_LOGOS } from "@/lib/constants/org-logos";
import PhotoUploader from "@/components/dashboard/PhotoUploader";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.is_anonymous) router.replace("/");
    });
  }, [supabase, router]);

  // Organizer fields
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [selectedLogo, setSelectedLogo] = useState("");
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);

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
      if (orgDescription.trim()) metadata.org_description = orgDescription.trim();
      if (uploadedLogoUrl) {
        metadata.org_logo_url = uploadedLogoUrl;
      } else if (selectedLogo) {
        metadata.org_logo_url = selectedLogo;
      }
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
      <h2 className="text-2xl font-heading font-bold text-center">Join the Adventure!</h2>

      <Button onClick={handleFacebookLogin} className="w-full bg-[#1877F2] hover:bg-[#166FE5]" size="lg">
        Continue with Facebook
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-4 text-gray-400 dark:text-gray-500">or</span>
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
            isOrganizer ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
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

              <div>
                <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Tell participants about your organization..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:focus:ring-lime-600 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {PRESET_ORG_LOGOS.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => {
                        setSelectedLogo(logo.id);
                        setUploadedLogoUrl(null);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                        selectedLogo === logo.id && !uploadedLogoUrl
                          ? "border-lime-500 bg-lime-50 dark:bg-lime-900/20 scale-105"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <span className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl", logo.color)}>
                        {logo.emoji}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{logo.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Or upload a custom logo:</p>
                <PhotoUploader
                  bucket="organizer-logos"
                  path="signup"
                  value={uploadedLogoUrl}
                  onChange={(url) => {
                    setUploadedLogoUrl(url);
                    if (url) setSelectedLogo("");
                  }}
                />
              </div>
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
        <Link href="/login" className="text-lime-600 dark:text-lime-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
