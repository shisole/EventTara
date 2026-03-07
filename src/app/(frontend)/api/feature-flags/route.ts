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
    showComingSoon: flags?.show_coming_soon === true,
    ewalletPayments: flags?.ewallet_payments === true,
    oauthStrava: flags?.oauth_strava === true,
    oauthFacebook: flags?.oauth_facebook === true,
    envOverride: process.env.ACTIVITY_FEED_ENABLED ?? null,
    cmsResult,
    cmsError,
  });
}
