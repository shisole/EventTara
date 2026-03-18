"use server";

import { isAdminUser } from "@/lib/admin/auth";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartUpload,
  uploadPart,
} from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

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
 * Step 1: Initiate a multipart upload on R2.
 * Returns the R2 uploadId and the object key to use for subsequent parts.
 */
export async function initiateVideoUploadAction(
  contentType: string,
  folder: string,
): Promise<{ uploadId?: string; key?: string; error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };

  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return { error: "Only MP4 and WebM videos are allowed" };
  }

  try {
    const ext = contentType === "video/webm" ? "webm" : "mp4";
    const key = `${folder}/${Date.now()}.${ext}`;
    const uploadId = await createMultipartUpload(key, contentType);
    return { uploadId, key };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[initiateVideoUpload] Error:", message);
    return { error: `Failed to initiate upload: ${message}` };
  }
}

/**
 * Step 2: Upload a single part (chunk) directly to R2.
 * Each part is forwarded to R2's multipart upload API — no in-memory state.
 */
export async function uploadVideoPartAction(
  formData: FormData,
): Promise<{ etag?: string; error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };

  const chunk = formData.get("chunk") as File | null;
  const key = formData.get("key") as string | null;
  const uploadId = formData.get("uploadId") as string | null;
  const partNumber = Number(formData.get("partNumber"));

  if (!chunk || !key || !uploadId || Number.isNaN(partNumber)) {
    return { error: "Missing required fields" };
  }

  try {
    const buffer = Buffer.from(await chunk.arrayBuffer());
    const etag = await uploadPart(key, uploadId, partNumber, buffer);
    return { etag };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[uploadVideoPart] Error:", message);
    return { error: `Part ${partNumber} failed: ${message}` };
  }
}

/**
 * Step 3: Complete the multipart upload.
 * R2 assembles all parts into the final object.
 */
export async function completeVideoUploadAction(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
): Promise<{ videoUrl?: string; error?: string }> {
  const err = await requireAdmin();
  if (err) return { error: err };

  try {
    await completeMultipartUpload(key, uploadId, parts);
    return { videoUrl: `/r2/${key}` };
  } catch (error) {
    await abortMultipartUpload(key, uploadId);
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[completeVideoUpload] Error:", message);
    return { error: `Failed to complete upload: ${message}` };
  }
}
