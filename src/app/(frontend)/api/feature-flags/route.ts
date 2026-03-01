import { NextResponse } from "next/server";

import { getCachedFeatureFlags, isActivityFeedEnabled } from "@/lib/payload/cached";

export async function GET() {
  let payloadResult: unknown = null;
  let payloadError: string | null = null;

  try {
    payloadResult = await getCachedFeatureFlags();
  } catch (error) {
    payloadError = error instanceof Error ? error.message : String(error);
  }

  const enabled = await isActivityFeedEnabled();

  return NextResponse.json({
    activityFeedEnabled: enabled,
    envOverride: process.env.ACTIVITY_FEED_ENABLED ?? null,
    payloadResult,
    payloadError,
  });
}
