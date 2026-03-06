import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClaimForm from "./ClaimForm";

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id, org_name, logo_url, pending_username, claim_expires_at, is_claimed")
    .eq("claim_token", token)
    .single();

  if (!profile) {
    notFound();
  }

  const isExpired = profile.claim_expires_at && new Date(profile.claim_expires_at) < new Date();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
        {profile.is_claimed ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Already Claimed</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This organizer account has already been claimed. If this is your account, you can log
              in to access your dashboard.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-lime-500 px-6 py-3 font-semibold text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : isExpired ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg
                className="h-8 w-8 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Link Expired</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This claim link has expired. Please contact the admin to request a new one.
            </p>
          </div>
        ) : (
          <ClaimForm
            token={token}
            orgName={profile.org_name}
            logoUrl={profile.logo_url}
            pendingUsername={profile.pending_username}
          />
        )}
      </div>
    </div>
  );
}
