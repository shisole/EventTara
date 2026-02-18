"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/events");
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

  const handleGuestContinue = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
    } else {
      router.push("/guest-setup");
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-center">Welcome Back!</h2>

      <Button onClick={handleFacebookLogin} className="w-full bg-[#1877F2] hover:bg-[#166FE5]" size="lg">
        Continue with Facebook
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-400">or</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
          placeholder="Your password"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-coral-500 hover:text-coral-600 font-medium">
            Sign Up
          </Link>
        </p>
        <button
          onClick={handleGuestContinue}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
