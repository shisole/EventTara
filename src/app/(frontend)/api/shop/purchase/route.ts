import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_id } = await request.json();

  if (!item_id) {
    return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  }

  const { data: result, error } = await supabase.rpc("purchase_shop_item", {
    p_user_id: user.id,
    p_item_id: item_id,
  });

  if (error) {
    console.error("[shop] purchase RPC error:", error.message);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }

  const rpcResult = result as {
    error?: string;
    success?: boolean;
    item_name?: string;
    new_balance?: number;
  };

  if (rpcResult.error) {
    return NextResponse.json({ error: rpcResult.error }, { status: 400 });
  }

  return NextResponse.json(rpcResult);
}
