import { NextResponse } from "next/server";

import { isReservedUsername } from "@/lib/constants/reserved-usernames";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: { username?: string; auto?: boolean } = await request.json();
  const admin = createServiceClient();

  // Auto-generate mode
  if (body.auto) {
    const meta = user.user_metadata;
    const name: string | undefined = meta?.full_name ?? meta?.name;
    const prefix = name?.trim()
      ? name
          .trim()
          .toLowerCase()
          .replaceAll(/\s+/g, ".")
          .replaceAll(/[^a-z0-9._-]/g, "")
      : (user.email ?? "user")
          .split("@")[0]
          .toLowerCase()
          .replaceAll(/[^a-z0-9._-]/g, "");

    let username = prefix || "user";

    const { data: taken } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (taken) {
      username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
    }

    await admin.from("users").update({ username }).eq("id", user.id);
    return NextResponse.json({ username });
  }

  // Manual username
  const username = body.username?.toLowerCase().trim();

  if (!username || !USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters: lowercase letters, numbers, dots, underscores, or hyphens.",
      },
      { status: 400 },
    );
  }

  if (isReservedUsername(username)) {
    return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
  }

  // Check availability
  const { data: taken } = await admin
    .from("users")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  await admin.from("users").update({ username }).eq("id", user.id);
  return NextResponse.json({ username });
}
