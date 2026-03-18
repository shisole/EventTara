"use server";

import { isAdminUser } from "@/lib/admin/auth";
import { getPresignedUploadUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

/**
 * Generate a presigned URL for direct client-to-R2 video upload.
 * The client uploads directly to R2, bypassing Vercel's 4.5 MB payload limit.
 */
export async function getVideoUploadUrlAction(
  contentType: string,
  folder: string,
): Promise<{ uploadUrl?: string; videoUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return { error: "Forbidden" };
  }

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_PUBLIC_URL) {
    return { error: "R2 storage is not configured" };
  }

  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return { error: "Only MP4 and WebM videos are allowed" };
  }

  try {
    const ext = contentType === "video/webm" ? "webm" : "mp4";
    const key = `${folder}/${Date.now()}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    return { uploadUrl, videoUrl: `/r2/${key}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[getVideoUploadUrl] Error:", message);
    return { error: `Failed to generate upload URL: ${message}` };
  }
}
