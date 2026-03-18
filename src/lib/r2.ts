import { AwsClient } from "aws4fetch";

let _r2: AwsClient | null = null;

function getR2Client(): AwsClient {
  if (!_r2) {
    _r2 = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    });
  }
  return _r2;
}

function r2Url(key: string): string {
  const bucket = process.env.R2_BUCKET_NAME || "eventtara";
  const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Upload a file to Cloudflare R2 and return its public URL.
 *
 * @param key   - Object key (e.g. "events/covers/1234567890.jpg")
 * @param body  - File contents as Buffer or Uint8Array
 * @param contentType - MIME type (e.g. "image/jpeg")
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const url = r2Url(key);

  const bytes = new Uint8Array(body);
  const res = await getR2Client().fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": bytes.byteLength.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: bytes,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/**
 * Initiate an R2 multipart upload (S3-compatible).
 * Returns the upload ID needed for subsequent part uploads.
 */
export async function createMultipartUpload(key: string, contentType: string): Promise<string> {
  const url = `${r2Url(key)}?uploads`;

  const res = await getR2Client().fetch(url, {
    method: "POST",
    headers: { "Content-Type": contentType },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CreateMultipartUpload failed (${res.status}): ${text}`);
  }

  const xml = await res.text();
  const match = /<UploadId>(.+?)<\/UploadId>/.exec(xml);
  if (!match) throw new Error("No UploadId in CreateMultipartUpload response");
  return match[1];
}

/**
 * Upload a single part of a multipart upload. Returns the ETag.
 * Part numbers are 1-indexed. Minimum part size is 5 MB (except last part).
 */
export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer | Uint8Array,
): Promise<string> {
  const url = `${r2Url(key)}?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`;

  const bytes = new Uint8Array(body);
  const res = await getR2Client().fetch(url, {
    method: "PUT",
    headers: { "Content-Length": bytes.byteLength.toString() },
    body: bytes,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UploadPart ${partNumber} failed (${res.status}): ${text}`);
  }

  const etag = res.headers.get("etag");
  if (!etag) throw new Error("No ETag in UploadPart response");
  return etag;
}

/**
 * Complete a multipart upload by providing the ordered list of parts.
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
): Promise<void> {
  const url = `${r2Url(key)}?uploadId=${encodeURIComponent(uploadId)}`;

  const partsXml = parts
    .map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
    .join("");
  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;

  const res = await getR2Client().fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CompleteMultipartUpload failed (${res.status}): ${text}`);
  }
}

/**
 * Abort a multipart upload, cleaning up any uploaded parts.
 */
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  const url = `${r2Url(key)}?uploadId=${encodeURIComponent(uploadId)}`;
  try {
    await getR2Client().fetch(url, { method: "DELETE" });
  } catch {
    // Cleanup is best-effort
  }
}
