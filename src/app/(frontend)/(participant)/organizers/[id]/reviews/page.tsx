import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeftIcon } from "@/components/icons";
import OrganizerReviewSection from "@/components/reviews/OrganizerReviewSection";
import PageShareButtons from "@/components/ui/PageShareButtons";
import { isOrganizerReviewsEnabled } from "@/lib/cms/cached";
import { resolveOrganizerProfile } from "@/lib/organizers/resolve-profile";
import { createClient } from "@/lib/supabase/server";
import type { OrganizerReviewsResponse } from "@/lib/types/organizer-reviews";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrUsername } = await params;
  const supabase = await createClient();

  const orgId = await resolveOrganizerProfile(supabase, idOrUsername);
  if (!orgId) return { title: "Reviews Not Found" };

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("org_name, logo_url")
    .eq("id", orgId)
    .single();

  if (!profile) return { title: "Reviews Not Found" };

  // Fetch aggregate stats for description
  const { data: reviewRows } = await supabase
    .from("organizer_reviews")
    .select("rating")
    .eq("organizer_id", orgId);

  const totalReviews = reviewRows?.length ?? 0;
  const avgRating =
    totalReviews > 0
      ? (reviewRows!.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null;

  const title = `${profile.org_name} Reviews | EventTara`;
  const description = avgRating
    ? `${profile.org_name} has ${avgRating} stars from ${totalReviews} review${totalReviews === 1 ? "" : "s"}. Read what participants say about this organizer on EventTara.`
    : `Read reviews for ${profile.org_name} on EventTara.`;

  const images = profile.logo_url ? [{ url: profile.logo_url, width: 200, height: 200 }] : [];

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" as const, images },
    twitter: {
      card: profile.logo_url ? ("summary" as const) : ("summary_large_image" as const),
      title,
      description,
      images,
    },
  };
}

export default async function OrganizerReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idOrUsername } = await params;
  const supabase = await createClient();

  const reviewsEnabled = await isOrganizerReviewsEnabled();
  if (!reviewsEnabled) notFound();

  const orgId = await resolveOrganizerProfile(supabase, idOrUsername);
  if (!orgId) notFound();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("org_name, logo_url, user_id")
    .eq("id", orgId)
    .single();

  if (!profile) notFound();

  // Fetch reviews + aggregates
  const { data: orgReviewRows } = await supabase
    .from("organizer_reviews")
    .select("rating, tags")
    .eq("organizer_id", orgId);

  const orgTotalReviews = orgReviewRows?.length ?? 0;
  let orgAvgRating = 0;
  const orgTagCounts: Record<string, number> = {};

  if (orgReviewRows && orgReviewRows.length > 0) {
    orgAvgRating = orgReviewRows.reduce((sum, r) => sum + r.rating, 0) / orgReviewRows.length;
    for (const review of orgReviewRows) {
      if (Array.isArray(review.tags)) {
        for (const tag of review.tags) {
          orgTagCounts[tag] = (orgTagCounts[tag] || 0) + 1;
        }
      }
    }
  }

  // Fetch first page of reviews with user info + photos
  const { data: orgReviews } = await supabase
    .from("organizer_reviews")
    .select(
      "*, users:user_id(full_name, username, avatar_url, active_border_id), organizer_review_photos(id, image_url, sort_order)",
    )
    .eq("organizer_id", orgId)
    .order("created_at", { ascending: false })
    .range(0, 9);

  const mappedReviews = (orgReviews || []).map((r: any) => ({
    id: r.id,
    organizer_id: r.organizer_id,
    user_id: r.is_anonymous ? null : r.user_id,
    rating: r.rating,
    text: r.text,
    is_anonymous: r.is_anonymous,
    tags: r.tags || [],
    created_at: r.created_at,
    updated_at: r.updated_at,
    user: r.is_anonymous
      ? null
      : {
          full_name: r.users?.full_name ?? "User",
          username: r.users?.username ?? null,
          avatar_url: r.users?.avatar_url ?? null,
          active_border_id: r.users?.active_border_id ?? null,
        },
    photos: (r.organizer_review_photos || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((p: any) => ({ id: p.id, image_url: p.image_url, sort_order: p.sort_order })),
  }));

  const orgReviewsData: OrganizerReviewsResponse = {
    reviews: mappedReviews,
    averageRating: orgAvgRating,
    totalReviews: orgTotalReviews,
    tagCounts: orgTagCounts,
    page: 1,
    hasMore: orgTotalReviews > 10,
  };

  // Check if the viewer is the organizer
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = authUser?.id === profile.user_id;

  // Check if current user already has a review
  let existingOrgReviewId: string | null = null;
  if (authUser) {
    const { data: myReview } = await supabase
      .from("organizer_reviews")
      .select("id")
      .eq("organizer_id", orgId)
      .eq("user_id", authUser.id)
      .single();
    existingOrgReviewId = myReview?.id ?? null;
  }

  // Get current user info for the review form
  let currentUserInfo: { id: string; fullName: string } | null = null;
  if (authUser) {
    const { data: authUserData } = await supabase
      .from("users")
      .select("full_name, is_guest")
      .eq("id", authUser.id)
      .single();
    if (authUserData && !authUserData.is_guest) {
      currentUserInfo = { id: authUser.id, fullName: authUserData.full_name };
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header with back link and share */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={`/organizers/${idOrUsername}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {profile.org_name}
        </Link>
        <PageShareButtons
          title={`${profile.org_name} Reviews`}
          path={`/organizers/${idOrUsername}/reviews`}
        />
      </div>

      <OrganizerReviewSection
        organizerId={orgId}
        organizerName={profile.org_name}
        initialData={orgReviewsData}
        currentUser={currentUserInfo}
        isOwnProfile={isOwnProfile}
        existingReviewId={existingOrgReviewId}
      />
    </div>
  );
}
