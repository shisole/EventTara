"use server";

import { isAdminUser } from "@/lib/admin/auth";
import { getPresignedUploadUrl, uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { compressVideo } from "@/lib/video/compress";

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) return "Forbidden";
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_PUBLIC_URL) {
    return "R2 storage is not configured";
  }
  return null;
}

/**
 * Generate a presigned URL for direct client-to-R2 video upload.
 * The client uploads directly to R2, bypassing Vercel's 4.5 MB payload limit.
 */
export async function getVideoUploadUrlAction(
  contentType: string,
  folder: string,
): Promise<{ uploadUrl?: string; videoUrl?: string; key?: string; error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };

  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return { error: "Only MP4 and WebM videos are allowed" };
  }

  try {
    const ext = contentType === "video/webm" ? "webm" : "mp4";
    const key = `${folder}/${Date.now()}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    return { uploadUrl, videoUrl: `/r2/${key}`, key };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getVideoUploadUrl] Error:", message);
    return { error: `Failed to generate upload URL: ${message}` };
  }
}

/**
 * Download a raw video from R2, compress it with ffmpeg, and re-upload.
 * Strips audio, scales to 1080p, CRF 28. Overwrites the original file.
 */
export async function compressVideoAction(key: string): Promise<{ error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };

  try {
    // Download raw video from R2
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    const res = await fetch(publicUrl);
    if (!res.ok) throw new Error(`Failed to download video (${res.status})`);
    const rawBuffer = Buffer.from(await res.arrayBuffer());

    // Compress with ffmpeg
    const compressed = await compressVideo(rawBuffer);

    // Re-upload compressed version to same key
    await uploadToR2(key, compressed, "video/mp4");

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[compressVideo] Error:", message);
    return { error: `Compression failed: ${message}` };
  }
}
