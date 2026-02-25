import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.toLowerCase().trim();

  if (!username) {
    return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        available: false,
        error:
          "Username must be 3-30 characters, lowercase letters, numbers, dots, underscores, or hyphens",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username)
    .limit(1)
    .single();

  return NextResponse.json({ available: !data });
}
