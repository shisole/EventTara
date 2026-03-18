"use server";

import { isAdminUser } from "@/lib/admin/auth";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { compressVideo } from "@/lib/video/compress";

const VIDEO_MAX_SIZE = 200 * 1024 * 1024; // 200 MB
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

// In-memory chunk storage (dev-safe, single process)
const pendingUploads = new Map<
  string,
  { chunks: (Buffer | null)[]; contentType: string; folder: string; createdAt: number }
>();

// Cleanup uploads older than 10 minutes
function cleanupStaleUploads() {
  const staleMs = 10 * 60 * 1000;
  const now = Date.now();
  for (const [id, upload] of pendingUploads) {
    if (now - upload.createdAt > staleMs) pendingUploads.delete(id);
  }
}

export async function uploadVideoChunkAction(
  formData: FormData,
): Promise<{ ok?: boolean; videoUrl?: string; error?: string }> {
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

  const chunk = formData.get("chunk") as File | null;
  const uploadId = formData.get("uploadId") as string | null;
  const chunkIndex = Number(formData.get("chunkIndex"));
  const totalChunks = Number(formData.get("totalChunks"));
  const contentType = formData.get("contentType") as string | null;
  const folder = formData.get("folder") as string | null;

  if (
    !chunk ||
    !uploadId ||
    !contentType ||
    !folder ||
    Number.isNaN(chunkIndex) ||
    Number.isNaN(totalChunks)
  ) {
    return { error: "Missing required fields" };
  }

  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return { error: "Only MP4 and WebM videos are allowed" };
  }

  try {
    cleanupStaleUploads();

    // Store this chunk
    if (!pendingUploads.has(uploadId)) {
      pendingUploads.set(uploadId, {
        chunks: Array.from<Buffer | null>({ length: totalChunks }).fill(null),
        contentType,
        folder,
        createdAt: Date.now(),
      });
    }

    const upload = pendingUploads.get(uploadId)!;
    upload.chunks[chunkIndex] = Buffer.from(await chunk.arrayBuffer());

    // Check if all chunks received
    const allReceived = upload.chunks.every((c) => c !== null);
    if (!allReceived) {
      return { ok: true };
    }

    // Concatenate, compress, and upload
    const fullBuffer = Buffer.concat(upload.chunks as Buffer[]);
    pendingUploads.delete(uploadId);

    if (fullBuffer.length > VIDEO_MAX_SIZE) {
      return { error: "Video too large (max 200 MB)" };
    }

    const compressed = await compressVideo(fullBuffer);
    const key = `${folder}/${Date.now()}.mp4`;
    await uploadToR2(key, compressed, "video/mp4");

    // Return proxy URL — avoids CORS issues; Next.js rewrites /r2/* to R2 public bucket
    return { videoUrl: `/r2/${key}` };
  } catch (error) {
    pendingUploads.delete(uploadId);
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[uploadVideoChunkAction] Error:", message);
    return { error: `Upload failed: ${message}` };
  }
}
