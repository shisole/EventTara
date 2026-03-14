import { NextResponse } from "next/server";

import { getCachedFeatureFlags, isActivityFeedEnabled } from "@/lib/cms/cached";

export async function GET() {
  let cmsResult: unknown = null;
  let cmsError: string | null = null;

  try {
    cmsResult = await getCachedFeatureFlags();
  } catch (error) {
    cmsError = error instanceof Error ? error.message : String(error);
  }

  const enabled = await isActivityFeedEnabled();
  const flags = cmsResult as Record<string, unknown> | null;

  return NextResponse.json({
    activityFeedEnabled: enabled,
    comingSoonStrava: flags?.coming_soon_strava === true,
    comingSoonGamification: flags?.coming_soon_gamification === true,
    comingSoonBento: flags?.coming_soon_bento === true,
    ewalletPayments: flags?.ewallet_payments === true,
    oauthGoogle: flags?.oauth_google === true,
    oauthStrava: flags?.oauth_strava === true,
    oauthFacebook: flags?.oauth_facebook === true,
    duckRace: flags?.duck_race === true,
    avatarShopEnabled: flags?.avatar_shop_enabled === true,
    newLandingPage: flags?.new_landing_page === true,
    paymentPause: flags?.payment_pause === true,
    envOverride: process.env.ACTIVITY_FEED_ENABLED ?? null,
    cmsResult,
    cmsError,
  });
}
