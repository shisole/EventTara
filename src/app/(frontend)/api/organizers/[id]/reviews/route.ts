import { NextResponse } from "next/server";

import {
  MAX_REVIEW_PHOTOS,
  MAX_REVIEW_TEXT_LENGTH,
  VALID_TAG_KEYS,
} from "@/lib/constants/review-tags";
import { createClient } from "@/lib/supabase/server";
import type {
  OrganizerReviewsResponse,
  OrganizerReviewWithUser,
} from "@/lib/types/organizer-reviews";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

/* ------------------------------------------------------------------ */
/*  GET — paginated reviews + aggregates                              */
/* ------------------------------------------------------------------ */
export async function GET(request: Request, { params }: RouteCtx) {
  const { id: organizerId } = await params;
  const supabase = await createClient();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const offset = (page - 1) * limit;

  // Verify organizer exists
  const { data: org } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("id", organizerId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  // Fetch all reviews for aggregates (ratings + tag counts)
  const { data: allReviews } = await supabase
    .from("organizer_reviews")
    .select("rating, tags")
    .eq("organizer_id", organizerId);

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
    .from("organizer_reviews")
    .select(
      "*, users:user_id(full_name, username, avatar_url, active_border_id), organizer_review_photos(id, image_url, sort_order)",
    )
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Redact user info for anonymous reviews
  const mapped: OrganizerReviewWithUser[] = (reviews || []).map((r: any) => ({
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

  const response: OrganizerReviewsResponse = {
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
  const { id: organizerId } = await params;
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

  const { rating, text, is_anonymous = false, tags = [], photo_urls = [] } = body;

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

  // Validate photo URLs
  if (!Array.isArray(photo_urls) || photo_urls.length > MAX_REVIEW_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_REVIEW_PHOTOS} photos allowed` },
      { status: 400 },
    );
  }

  // Verify organizer exists
  const { data: org } = await supabase
    .from("organizer_profiles")
    .select("id, user_id")
    .eq("id", organizerId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  // Prevent self-review
  if (org.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot review your own organizer profile" },
      { status: 400 },
    );
  }

  // Check for existing review (UNIQUE constraint also prevents this, but nice error message)
  const { data: existing } = await supabase
    .from("organizer_reviews")
    .select("id")
    .eq("organizer_id", organizerId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this organizer. Use PATCH to edit." },
      { status: 409 },
    );
  }

  // Insert review
  const { data: review, error } = await supabase
    .from("organizer_reviews")
    .insert({
      organizer_id: organizerId,
      user_id: user.id,
      rating,
      text: text?.trim() || null,
      is_anonymous,
      tags,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert photos if any
  if (photo_urls.length > 0) {
    const photoRows = photo_urls.map((url, i) => ({
      review_id: review.id,
      image_url: url,
      sort_order: i,
    }));
    await supabase.from("organizer_review_photos").insert(photoRows);
  }

  return NextResponse.json({ review }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  PATCH — edit own review                                           */
/* ------------------------------------------------------------------ */
export async function PATCH(request: Request, { params }: RouteCtx) {
  const { id: organizerId } = await params;
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

  // Find existing review
  const { data: existing } = await supabase
    .from("organizer_reviews")
    .select("id")
    .eq("organizer_id", organizerId)
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
    .from("organizer_reviews")
    .update(update)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace photos if provided
  if (photo_urls !== undefined) {
    // Delete old photos
    await supabase.from("organizer_review_photos").delete().eq("review_id", existing.id);

    // Insert new photos
    if (photo_urls.length > 0) {
      const photoRows = photo_urls.map((url, i) => ({
        review_id: existing.id,
        image_url: url,
        sort_order: i,
      }));
      await supabase.from("organizer_review_photos").insert(photoRows);
    }
  }

  return NextResponse.json({ review });
}
