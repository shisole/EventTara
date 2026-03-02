import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let _r2: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
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
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "eventtara",
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
