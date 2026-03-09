/**
 * @deprecated — Organizer reviews have been replaced by club reviews.
 * Use /api/clubs/[slug]/reviews instead.
 * This route is kept temporarily for backward compatibility.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Use /api/clubs/[slug]/reviews instead." },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Use /api/clubs/[slug]/reviews instead." },
    { status: 410 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Use /api/clubs/[slug]/reviews instead." },
    { status: 410 },
  );
}
