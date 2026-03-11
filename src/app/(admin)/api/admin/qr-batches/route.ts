import crypto from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: batches, error } = await supabase
    .from("qr_claim_batches")
    .select("*, badges(title, image_url, rarity, category)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get claim counts for each batch
  const enriched = await Promise.all(
    (batches || []).map(async (batch) => {
      const { count } = await supabase
        .from("qr_claim_codes")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", batch.id)
        .not("claimed_by", "is", null);

      return {
        ...batch,
        claimed_count: count ?? 0,
      };
    }),
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { badge_id, new_badge, name, quantity } = body as {
    badge_id?: string;
    new_badge?: {
      title: string;
      description?: string;
      image_url?: string;
      rarity?: "common" | "rare" | "epic" | "legendary";
      category?: "distance" | "adventure" | "location" | "special";
    };
    name?: string;
    quantity?: number;
  };

  if (!badge_id && !new_badge) {
    return NextResponse.json({ error: "Badge is required" }, { status: 400 });
  }
  if (!name || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Edition name is required (min 2 characters)" },
      { status: 400 },
    );
  }
  if (!quantity || quantity < 1 || quantity > 1000) {
    return NextResponse.json({ error: "Quantity must be between 1 and 1000" }, { status: 400 });
  }

  let finalBadgeId = badge_id;

  // Create new badge if provided
  if (new_badge) {
    if (!new_badge.title?.trim()) {
      return NextResponse.json({ error: "Badge title is required" }, { status: 400 });
    }

    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .insert({
        title: new_badge.title.trim(),
        description: new_badge.description?.trim() ?? null,
        image_url: new_badge.image_url ?? null,
        category: new_badge.category ?? "special",
        rarity: new_badge.rarity ?? "legendary",
        type: "system",
        criteria_key: "qr_claim",
      })
      .select("id")
      .single();

    if (badgeError) {
      return NextResponse.json({ error: badgeError.message }, { status: 500 });
    }

    finalBadgeId = badge.id;
  } else {
    // Verify existing badge
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("id, title")
      .eq("id", badge_id!)
      .single();

    if (badgeError || !badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }
  }

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from("qr_claim_batches")
    .insert({
      badge_id: finalBadgeId!,
      name: name.trim(),
      quantity,
      created_by: user.id,
    })
    .select()
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  // Generate unique tokens for each code
  const codes = Array.from({ length: quantity }, (_, i) => ({
    batch_id: batch.id,
    token: crypto.randomBytes(16).toString("hex"),
    serial_number: i + 1,
  }));

  const { error: codesError } = await supabase.from("qr_claim_codes").insert(codes);

  if (codesError) {
    // Clean up batch if codes failed
    await supabase.from("qr_claim_batches").delete().eq("id", batch.id);
    return NextResponse.json({ error: codesError.message }, { status: 500 });
  }

  return NextResponse.json(batch, { status: 201 });
}
