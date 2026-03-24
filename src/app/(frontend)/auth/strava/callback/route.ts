import { after, NextResponse } from "next/server";

import { checkAndAwardSystemBadges } from "@/lib/badges/check-system-badges";
import { createNotifications } from "@/lib/notifications/create";
import { STRAVA_TOKEN_URL } from "@/lib/strava/constants";
import { type StravaTokenResponse } from "@/lib/strava/types";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { type Json } from "@/lib/supabase/types";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

interface OAuthState {
  flow: "login" | "connect";
  returnUrl?: string;
}

/**
 * Strava OAuth callback handler.
 *
 * Handles three flows:
 * 1. **New user** — creates a Supabase auth user + public users row + strava_connections row
 * 2. **Existing user** — signs them in via magic link exchange, updates tokens
 * 3. **Connect** — links Strava to the currently logged-in user
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Strava sends error param if user denied access
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=strava_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=strava_no_code`);
  }

  // Parse state
  let state: OAuthState = { flow: "login" };
  if (stateParam) {
    try {
      state = JSON.parse(stateParam) as OAuthState;
    } catch {
      // Ignore malformed state, default to login
    }
  }

  // -------------------------------------------------------------------------
  // Step 1: Exchange code for Strava tokens
  // -------------------------------------------------------------------------
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[Strava Callback] Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET");
    return NextResponse.redirect(`${origin}/login?error=strava_config`);
  }

  let tokenData: StravaTokenResponse;
  try {
    const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => "unknown");
      console.error("[Strava Callback] Token exchange failed:", errorText);
      return NextResponse.redirect(`${origin}/login?error=strava_token_failed`);
    }

    tokenData = (await tokenResponse.json()) as StravaTokenResponse;
  } catch (error) {
    console.error("[Strava Callback] Token exchange error:", error);
    return NextResponse.redirect(`${origin}/login?error=strava_token_failed`);
  }

  const { athlete, access_token, refresh_token, expires_at } = tokenData;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Strava Callback] Missing SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.redirect(`${origin}/login?error=strava_config`);
  }

  const serviceClient = createServiceClient();

  // -------------------------------------------------------------------------
  // Step 2: Handle "connect" flow — link Strava to existing logged-in user
  // -------------------------------------------------------------------------
  if (state.flow === "connect") {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.redirect(`${origin}/login?error=strava_not_logged_in`);
    }

    // Check if this Strava account is already linked to someone else
    const { data: existingConnection } = await serviceClient
      .from("strava_connections")
      .select("user_id")
      .eq("strava_athlete_id", athlete.id)
      .single();

    if (existingConnection && existingConnection.user_id !== currentUser.id) {
      const returnUrl = state.returnUrl || "/profile/" + currentUser.id;
      return NextResponse.redirect(`${origin}${returnUrl}?error=strava_already_linked`);
    }

    // Upsert the connection
    await serviceClient.from("strava_connections").upsert(
      {
        user_id: currentUser.id,
        strava_athlete_id: athlete.id,
        access_token,
        refresh_token,
        expires_at: new Date(expires_at * 1000).toISOString(),
        scope: "read,activity:read_all,activity:write",
        athlete_data: athlete as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // Fire-and-forget: award coins for connecting Strava
    void awardTokens(
      serviceClient,
      currentUser.id,
      TOKEN_REWARDS.strava_connected,
      "strava_connected",
      `strava_${String(athlete.id)}`,
    ).catch(() => null);

    // Award "Connected Athlete" badge + notify (runs after response)
    after(async () => {
      try {
        const connectBadges = await checkAndAwardSystemBadges(currentUser.id, serviceClient);
        if (connectBadges.length > 0) {
          await createNotifications(
            serviceClient,
            connectBadges.map((b) => ({
              userId: currentUser.id,
              type: "badge_earned" as const,
              title: "Badge Unlocked!",
              body: `You earned: ${b.title}`,
              href: "/achievements",
            })),
          );
        }
      } catch {
        // Badge/notification failures should not affect the redirect
      }
    });

    const returnUrl = state.returnUrl || "/profile/" + currentUser.id;
    return NextResponse.redirect(`${origin}${returnUrl}?strava=connected`);
  }

  // -------------------------------------------------------------------------
  // Step 3: Check if Strava athlete is already linked to a user
  // -------------------------------------------------------------------------
  const { data: existingConnection } = await serviceClient
    .from("strava_connections")
    .select("user_id")
    .eq("strava_athlete_id", athlete.id)
    .single();

  if (existingConnection) {
    // -----------------------------------------------------------------------
    // Existing user — update tokens, sign them in
    // -----------------------------------------------------------------------
    await serviceClient
      .from("strava_connections")
      .update({
        access_token,
        refresh_token,
        expires_at: new Date(expires_at * 1000).toISOString(),
        athlete_data: athlete as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", existingConnection.user_id);

    // Get the user's email to generate a magic link for signing in
    const { data: authUser } = await serviceClient.auth.admin.getUserById(
      existingConnection.user_id,
    );

    if (!authUser?.user?.email) {
      console.error("[Strava Callback] Could not find auth user for existing connection");
      return NextResponse.redirect(`${origin}/login?error=strava_user_not_found`);
    }

    // Generate a magic link and exchange it to create a session
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[Strava Callback] Failed to generate magic link:", linkError);
      return NextResponse.redirect(`${origin}/login?error=strava_session_failed`);
    }

    // Use the server client to verify the OTP token, which sets the session cookies
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    });

    if (verifyError) {
      console.error("[Strava Callback] Failed to verify OTP:", verifyError);
      return NextResponse.redirect(`${origin}/login?error=strava_session_failed`);
    }

    return NextResponse.redirect(`${origin}/events`);
  }

  // -------------------------------------------------------------------------
  // Step 4: New user — create Supabase auth user + public user + connection
  // -------------------------------------------------------------------------
  const stravaEmail =
    athlete.firstname && athlete.lastname
      ? null // Strava doesn't expose email in athlete profile
      : null;

  // Generate a unique email for Strava users (Strava API does not return email)
  const generatedEmail = stravaEmail || `strava_${String(athlete.id)}@strava.eventtara.com`;
  const fullName = [athlete.firstname, athlete.lastname].filter(Boolean).join(" ") || "Strava User";

  // Create the Supabase auth user
  const { data: newAuthUser, error: createError } = await serviceClient.auth.admin.createUser({
    email: generatedEmail,
    email_confirm: true, // Skip email verification for Strava OAuth users
    user_metadata: {
      full_name: fullName,
      avatar_url: athlete.profile || athlete.profile_medium || null,
      provider: "strava",
      strava_athlete_id: athlete.id,
    },
  });

  if (createError || !newAuthUser?.user) {
    console.error("[Strava Callback] Failed to create auth user:", createError);
    return NextResponse.redirect(`${origin}/login?error=strava_create_failed`);
  }

  const newUserId = newAuthUser.user.id;

  // The public users row may have been auto-created by a trigger.
  // Update it with the Strava profile info.
  const { data: existingPublicUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("id", newUserId)
    .single();

  await (existingPublicUser
    ? serviceClient
        .from("users")
        .update({
          full_name: fullName,
          avatar_url: athlete.profile || athlete.profile_medium || null,
          email: generatedEmail,
        })
        .eq("id", newUserId)
    : serviceClient.from("users").insert({
        id: newUserId,
        full_name: fullName,
        avatar_url: athlete.profile || athlete.profile_medium || null,
        email: generatedEmail,
        role: "user",
      }));

  // Generate username from Strava username or name
  const baseUsername =
    athlete.username ||
    [athlete.firstname, athlete.lastname]
      .filter(Boolean)
      .join(".")
      .toLowerCase()
      .replaceAll(/[^a-z0-9._-]/g, "") ||
    "user";

  let username = baseUsername.slice(0, 30);
  const { data: takenUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (takenUser) {
    username = `${username.slice(0, 26)}${String(Math.floor(Math.random() * 9000) + 1000)}`;
  }

  await serviceClient.from("users").update({ username }).eq("id", newUserId);

  // Create the strava_connections row
  await serviceClient.from("strava_connections").insert({
    user_id: newUserId,
    strava_athlete_id: athlete.id,
    access_token,
    refresh_token,
    expires_at: new Date(expires_at * 1000).toISOString(),
    scope: "read,activity:read_all,activity:write",
    athlete_data: athlete as unknown as Json,
  });

  // Award signup bonus tokens
  void awardTokens(serviceClient, newUserId, TOKEN_REWARDS.signup, "milestone", "signup").catch(
    () => null,
  );

  // Award coins for connecting Strava
  void awardTokens(
    serviceClient,
    newUserId,
    TOKEN_REWARDS.strava_connected,
    "strava_connected",
    `strava_${String(athlete.id)}`,
  ).catch(() => null);

  // Award "Connected Athlete" badge + notify (runs after response)
  after(async () => {
    try {
      const awardedBadges = await checkAndAwardSystemBadges(newUserId, serviceClient);
      if (awardedBadges.length > 0) {
        await createNotifications(
          serviceClient,
          awardedBadges.map((b) => ({
            userId: newUserId,
            type: "badge_earned" as const,
            title: "Badge Unlocked!",
            body: `You earned: ${b.title}`,
            href: "/achievements",
          })),
        );
      }
    } catch {
      // Badge/notification failures should not affect the redirect
    }
  });

  // Sign the new user in by generating a magic link and verifying it
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email: generatedEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[Strava Callback] Failed to generate magic link for new user:", linkError);
    // User was created but couldn't be signed in — redirect to login
    return NextResponse.redirect(`${origin}/login?message=account_created`);
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyError) {
    console.error("[Strava Callback] Failed to verify OTP for new user:", verifyError);
    return NextResponse.redirect(`${origin}/login?message=account_created`);
  }

  return NextResponse.redirect(`${origin}/setup-avatar?next=${encodeURIComponent("/welcome")}`);
}
