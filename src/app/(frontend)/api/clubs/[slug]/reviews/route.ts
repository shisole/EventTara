import { NextResponse } from "next/server";

import { awardFirstReviewBadge } from "@/lib/badges/check-pioneer-badges";
import {
  MAX_REVIEW_PHOTOS,
  MAX_REVIEW_TEXT_LENGTH,
  VALID_TAG_KEYS,
} from "@/lib/constants/review-tags";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";
import type { ClubReviewsResponse, ClubReviewWithUser } from "@/lib/types/club-reviews";

interface RouteCtx {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  GET — paginated reviews + aggregates                              */
/* ------------------------------------------------------------------ */
export async function GET(request: Request, { params }: RouteCtx) {
  const { slug } = await params;
  const supabase = await createClient();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const offset = (page - 1) * limit;

  // Look up club by slug
  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const clubId = club.id;

  // Fetch all reviews for aggregates (ratings + tag counts)
  const { data: allReviews } = await supabase
    .from("club_reviews")
    .select("rating, tags")
    .eq("club_id", clubId);

  const totalReviews = allReviews?.length ?? 0;
  let averageRating = 0;
  const tagCounts: Record<string, number> = {};

  if (allReviews && allReviews.length > 0) {
    averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    for (const review of allReviews) {
      if (Array.isArray(review.tags)) {
        for (const tag of review.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
  }

  // Fetch paginated reviews with user info + photos
  const { data: reviews, error } = await supabase
    .from("club_reviews")
    .select(
      "*, users:user_id(full_name, username, avatar_url, active_border_id), club_review_photos(id, image_url, sort_order)",
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[club-reviews GET] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  // Redact user info for anonymous reviews
  const mapped: ClubReviewWithUser[] = (reviews || []).map((r: any) => ({
    id: r.id,
    club_id: r.club_id,
    user_id: r.is_anonymous ? null : r.user_id,
    rating: r.rating,
    text: r.text,
    is_anonymous: r.is_anonymous,
    guest_name: r.guest_name ?? null,
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
    photos: (r.club_review_photos || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((p: any) => ({ id: p.id, image_url: p.image_url, sort_order: p.sort_order })),
  }));

  const response: ClubReviewsResponse = {
    reviews: mapped,
    averageRating,
    totalReviews,
    tagCounts,
    page,
    hasMore: offset + limit < totalReviews,
  };

  return NextResponse.json(response);
}

/* ------------------------------------------------------------------ */
/*  POST — create a review                                            */
/* ------------------------------------------------------------------ */
export async function POST(request: Request, { params }: RouteCtx) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: {
    rating?: number;
    text?: string;
    is_anonymous?: boolean;
    guest_name?: string;
    tags?: string[];
    photo_urls?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rating, text, is_anonymous = false, guest_name, tags = [], photo_urls = [] } = body;
  const isGuestReview = !user && !!guest_name;

  // Must be logged in OR submitting as guest with a name
  if (!user && !isGuestReview) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate guest name
  if (isGuestReview && (!guest_name.trim() || guest_name.trim().length > 100)) {
    return NextResponse.json(
      { error: "Please provide a valid name (max 100 characters)" },
      { status: 400 },
    );
  }

  // Validate rating
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  // Validate text
  if (text && typeof text === "string" && text.trim().length > MAX_REVIEW_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Review text must be ${MAX_REVIEW_TEXT_LENGTH} characters or less` },
      { status: 400 },
    );
  }

  // Validate tags
  if (!Array.isArray(tags) || tags.some((t) => !VALID_TAG_KEYS.has(t))) {
    return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
  }

  // Validate photo URLs (guests cannot upload photos)
  if (isGuestReview && photo_urls.length > 0) {
    return NextResponse.json({ error: "Guests cannot upload photos" }, { status: 400 });
  }
  if (!Array.isArray(photo_urls) || photo_urls.length > MAX_REVIEW_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_REVIEW_PHOTOS} photos allowed` },
      { status: 400 },
    );
  }

  const admin = createServiceClient();

  // Look up club by slug
  const { data: club } = await admin.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const clubId = club.id;

  // Look up the club owner via club_members
  const { data: ownerMember } = await admin
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId)
    .eq("role", "owner")
    .single();

  const ownerId = ownerMember?.user_id ?? null;

  if (user) {
    // --- Authenticated review ---

    // Prevent self-review (club owner)
    if (ownerId && ownerId === user.id) {
      return NextResponse.json({ error: "You cannot review your own club" }, { status: 400 });
    }

    // Check for existing review
    const { data: existing } = await admin
      .from("club_reviews")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this club. Edit your existing review instead." },
        { status: 409 },
      );
    }

    const { data: review, error } = await admin
      .from("club_reviews")
      .insert({
        club_id: clubId,
        user_id: user.id,
        rating,
        text: text?.trim() || null,
        is_anonymous,
        tags,
      })
      .select()
      .single();

    if (error) {
      console.error("[club-reviews POST] DB error:", error.message);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    // Insert photos if any
    if (photo_urls.length > 0) {
      const photoRows = photo_urls.map((url, i) => ({
        review_id: review.id,
        image_url: url,
        sort_order: i,
      }));
      await admin.from("club_review_photos").insert(photoRows);
    }

    // Fire-and-forget: award "First Review" badge if non-anonymous
    if (!is_anonymous) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      awardFirstReviewBadge(user.id, supabase).catch(() => {});
    }

    // Fire-and-forget: award coins for submitting a review
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    awardTokens(admin, user.id, TOKEN_REWARDS.review, "review", review.id).catch(() => {});
    if (photo_urls.length > 0) {
      const p = awardTokens(
        admin,
        user.id,
        TOKEN_REWARDS.review_photo_bonus,
        "review_photo_bonus",
        review.id,
      );
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      p.catch(() => {});
    }

    return NextResponse.json({ review }, { status: 201 });
  }

  // --- Guest review (no auth, uses service client) ---
  if (!ownerId) {
    return NextResponse.json({ error: "Club has no owner" }, { status: 500 });
  }

  // Use club owner's user_id as a placeholder — guest reviews are always anonymous
  const { data: review, error } = await admin
    .from("club_reviews")
    .insert({
      club_id: clubId,
      user_id: ownerId,
      rating,
      text: text?.trim() || null,
      is_anonymous: true,
      guest_name: guest_name!.trim(),
      tags,
    })
    .select()
    .single();

  if (error) {
    console.error("[club-reviews POST guest] DB error:", error.message);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }

  return NextResponse.json({ review }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  PATCH — edit own review                                           */
/* ------------------------------------------------------------------ */
export async function PATCH(request: Request, { params }: RouteCtx) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    rating?: number;
    text?: string;
    is_anonymous?: boolean;
    tags?: string[];
    photo_urls?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Look up club by slug
  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const clubId = club.id;

  // Find existing review
  const { data: existing } = await supabase
    .from("club_reviews")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const { rating, text, is_anonymous, tags, photo_urls } = body;

  // Build update object
  const update: Record<string, unknown> = {};
  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }
    update.rating = rating;
  }
  if (text !== undefined) {
    if (typeof text === "string" && text.trim().length > MAX_REVIEW_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Review text must be ${MAX_REVIEW_TEXT_LENGTH} characters or less` },
        { status: 400 },
      );
    }
    update.text = text?.trim() || null;
  }
  if (is_anonymous !== undefined) update.is_anonymous = is_anonymous;
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.some((t) => !VALID_TAG_KEYS.has(t))) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
    update.tags = tags;
  }

  // Validate photo URLs
  if (
    photo_urls !== undefined &&
    (!Array.isArray(photo_urls) || photo_urls.length > MAX_REVIEW_PHOTOS)
  ) {
    return NextResponse.json(
      { error: `Maximum ${MAX_REVIEW_PHOTOS} photos allowed` },
      { status: 400 },
    );
  }

  // Update review
  const { data: review, error } = await supabase
    .from("club_reviews")
    .update(update)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    console.error("[club-reviews PATCH] DB error:", error.message);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }

  // Replace photos if provided
  if (photo_urls !== undefined) {
    // Delete old photos
    await supabase.from("club_review_photos").delete().eq("review_id", existing.id);

    // Insert new photos
    if (photo_urls.length > 0) {
      const photoRows = photo_urls.map((url, i) => ({
        review_id: existing.id,
        image_url: url,
        sort_order: i,
      }));
      await supabase.from("club_review_photos").insert(photoRows);

      // Award photo bonus if not already awarded for this review
      const { data: existingBonus } = await supabase
        .from("token_transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("reason", "review_photo_bonus")
        .eq("reference_id", existing.id)
        .single();

      if (!existingBonus) {
        const p = awardTokens(
          supabase,
          user.id,
          TOKEN_REWARDS.review_photo_bonus,
          "review_photo_bonus",
          existing.id,
        );
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        p.catch(() => {});
      }
    }
  }

  return NextResponse.json({ review });
}
