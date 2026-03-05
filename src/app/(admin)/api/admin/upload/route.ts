import { NextResponse } from "next/server";
import sharp from "sharp";

import { isAdminUser } from "@/lib/admin/auth";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FOLDERS = new Set(["hero"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({ error: "R2 storage is not configured" }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();

    // High-res: 1920px wide, WebP quality 85
    const highRes = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Mobile: 1024px wide, WebP quality 75
    const mobile = await sharp(buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const [url, mobileUrl] = await Promise.all([
      uploadToR2(`${folder}/${timestamp}.webp`, highRes, "image/webp"),
      uploadToR2(`${folder}/${timestamp}-mobile.webp`, mobile, "image/webp"),
    ]);

    return NextResponse.json({ url, mobileUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin/upload] Processing error:", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
