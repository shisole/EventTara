import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    name,
    category,
    description,
    rental_price,
    quantity_total,
    image_url,
    sizes,
    is_active,
    sort_order,
  } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) {
    const validCategories = [
      "tent",
      "sleeping_bag",
      "trekking_poles",
      "bike",
      "helmet",
      "backpack",
      "other",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = category;
  }
  if (description !== undefined) updates.description = description;
  if (rental_price !== undefined) updates.rental_price = rental_price;
  if (quantity_total !== undefined) updates.quantity_total = quantity_total;
  if (image_url !== undefined) updates.image_url = image_url;
  if (sizes !== undefined) updates.sizes = sizes;
  if (is_active !== undefined) updates.is_active = is_active;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("club_rental_items")
    .update(updates)
    .eq("id", id)
    .eq("club_id", club.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("club_rental_items")
    .delete()
    .eq("id", id)
    .eq("club_id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
