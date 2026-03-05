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
  const bucket = process.env.R2_BUCKET_NAME || "eventtara";
  const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${bucket}/${key}`;

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
