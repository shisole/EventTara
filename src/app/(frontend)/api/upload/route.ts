import { NextResponse } from "next/server";

import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

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
  "clubs/payment-qr",
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

  const isVideo = VIDEO_FOLDERS.has(folder);
  const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
  if (file.size > sizeLimit) {
    const limitMB = sizeLimit / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large (max ${String(limitMB)} MB)` },
      { status: 400 },
    );
  }

  // Validate MIME type
  const allowedTypes = isVideo
    ? new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES])
    : ALLOWED_IMAGE_TYPES;
  if (!file.type || !allowedTypes.has(file.type)) {
    return NextResponse.json(
      {
        error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" + (isVideo ? ", MP4, WebM" : ""),
      },
      { status: 400 },
    );
  }

  const ext = MIME_TO_EXT[file.type] || "jpg";
  const key = `${folder}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToR2(key, buffer, file.type);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] R2 error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
