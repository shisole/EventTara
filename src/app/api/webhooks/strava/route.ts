import { type NextRequest, NextResponse } from "next/server";

import { type StravaWebhookEvent } from "@/lib/strava/types";
import { handleActivityCreate } from "@/lib/strava/webhook";

const LOG_PREFIX = "[Strava Webhook]";

/**
 * GET /api/webhooks/strava
 *
 * Strava subscription validation endpoint. Strava sends a GET request with:
 * - hub.mode=subscribe
 * - hub.challenge=<random string>
 * - hub.verify_token=<your verify token>
 *
 * We verify the token matches our env var and echo the challenge back.
 */
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (!expectedToken) {
    console.error(`${LOG_PREFIX} STRAVA_WEBHOOK_VERIFY_TOKEN is not configured`);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (mode !== "subscribe" || !challenge || verifyToken !== expectedToken) {
    console.warn(
      `${LOG_PREFIX} Validation failed — mode: ${mode ?? "null"}, token match: ${String(verifyToken === expectedToken)}`,
    );
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  console.log(`${LOG_PREFIX} Subscription validated successfully`);
  return NextResponse.json({ "hub.challenge": challenge });
}

/**
 * POST /api/webhooks/strava
 *
 * Receives activity events from Strava. We only process new activity creations;
 * all other events are acknowledged but ignored.
 *
 * Strava expects a 200 response within 2 seconds, so we kick off processing
 * asynchronously and respond immediately.
 */
export async function POST(request: NextRequest) {
  let body: StravaWebhookEvent;
  try {
    body = (await request.json()) as StravaWebhookEvent;
  } catch {
    console.error(`${LOG_PREFIX} Failed to parse webhook body`);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(
    `${LOG_PREFIX} Received event: ${body.aspect_type} ${body.object_type} ${String(body.object_id)}`,
  );

  // Only process new activity creations
  if (body.aspect_type === "create" && body.object_type === "activity") {
    // Process asynchronously — Strava expects a fast 200 response
    handleActivityCreate(body.owner_id, body.object_id).catch((error) => {
      console.error(`${LOG_PREFIX} Error processing activity create:`, error);
    });
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ status: "ok" });
}
