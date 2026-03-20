import { NextResponse } from "next/server";

import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_FOLDERS = new Set([
  "events/covers",
  "badges/images",
  "organizers/logos",
  "reviews/photos",
  "clubs/covers",
  "clubs/logos",
  "clubs/forum",
  "events/photos",
  "events/videos",
  "welcome/heroes",
  "activity-types",
]);

const VIDEO_FOLDERS = new Set(["events/videos"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file || !folder) {
    return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  }

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const sizeLimit = VIDEO_FOLDERS.has(folder) ? MAX_VIDEO_SIZE : MAX_SIZE;
  if (file.size > sizeLimit) {
    const limitMB = sizeLimit / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large (max ${String(limitMB)} MB)` },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `${folder}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToR2(key, buffer, file.type || "image/jpeg");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] R2 error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
