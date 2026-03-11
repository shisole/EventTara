import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { validateWelcomePage } from "@/lib/welcome/validate";

import WelcomeClient from "./WelcomeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("welcome_pages")
    .select("title, subtitle")
    .eq("code", code)
    .maybeSingle();

  return {
    title: page ? `${page.title} — EventTara` : "Welcome — EventTara",
    description: page?.subtitle ?? "Welcome to EventTara!",
  };
}

export default async function WelcomePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  // Fetch welcome page
  const { data: page, error: pageError } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (pageError || !page) {
    notFound();
  }

  // Get claim count
  const { count: claimCount } = await supabase
    .from("welcome_page_claims")
    .select("id", { count: "exact", head: true })
    .eq("welcome_page_id", page.id);

  // Validate page
  const validation = validateWelcomePage({
    is_active: page.is_active,
    expires_at: page.expires_at,
    max_claims: page.max_claims,
    claimCount: claimCount ?? 0,
  });

  if (!validation.valid) {
    const messages: Record<string, { title: string; body: string }> = {
      inactive: {
        title: "Page Unavailable",
        body: "This welcome page is no longer active.",
      },
      expired: {
        title: "Offer Expired",
        body: "This welcome offer has expired.",
      },
      max_claims_reached: {
        title: "All Claimed",
        body: "All rewards for this offer have been claimed.",
      },
    };
    const msg = messages[validation.error];
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-8 w-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">{msg.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{msg.body}</p>
        </div>
      </div>
    );
  }

  // Fetch badge data if linked
  let badge: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: "distance" | "adventure" | "location" | "special";
    rarity: "common" | "rare" | "epic" | "legendary";
  } | null = null;

  if (page.badge_id) {
    const { data: badgeData } = await supabase
      .from("badges")
      .select("id, title, description, image_url, category, rarity")
      .eq("id", page.badge_id)
      .maybeSingle();
    badge = badgeData;
  }

  // Fetch club data if linked
  let club: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
  } | null = null;

  if (page.club_id) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("id, name, slug, logo_url, description")
      .eq("id", page.club_id)
      .maybeSingle();
    club = clubData;
  }

  // Check auth & existing claim
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasClaimed = false;
  if (user) {
    const { data: existingClaim } = await supabase
      .from("welcome_page_claims")
      .select("id")
      .eq("welcome_page_id", page.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasClaimed = !!existingClaim;
  }

  // Check if user is already a club member
  let isClubMember = false;
  if (user && club) {
    const { data: membership } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isClubMember = !!membership;
  }

  const spotsRemaining = page.max_claims === null ? null : page.max_claims - (claimCount ?? 0);

  return (
    <WelcomeClient
      code={code}
      title={page.title}
      subtitle={page.subtitle}
      description={page.description}
      heroImageUrl={page.hero_image_url}
      redirectUrl={page.redirect_url}
      badge={badge}
      club={club}
      isClubMember={isClubMember}
      spotsRemaining={spotsRemaining}
      isLoggedIn={!!user}
      hasClaimed={hasClaimed}
    />
  );
}
