import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomBytes } from "node:crypto"

/**
 * Cloudflare R2 client — S3-compatible.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID          (e.g. 99c107d65bd7cf9699d862b29462843c)
 *   R2_ACCESS_KEY_ID       (S3-compat key — create in Cloudflare dashboard → R2 → Manage API Tokens)
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET              (e.g. teammates-hq-uploads)
 *   R2_PUBLIC_BASE         (e.g. https://cdn.zloojesse.com) — used to build the public URL after upload
 */

let cached: S3Client | null = null

export function r2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
}

function getClient() {
  if (cached) return cached
  if (!r2Configured()) throw new Error("R2 not configured — see src/lib/r2.ts for required env vars")
  cached = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  return cached
}

export function makeKey(filename: string, userId: string) {
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = randomBytes(8).toString("hex")
  return `posts/${stamp}/${userId.slice(0, 8)}/${rand}.${ext}`
}

export function publicUrlFor(key: string): string {
  const base = process.env.R2_PUBLIC_BASE
  if (!base) {
    // Fallback to R2 public dev URL pattern (requires bucket to be made public)
    return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`
  }
  return `${base.replace(/\/$/, "")}/${key}`
}

export async function getPresignedPut(key: string, contentType: string, expiresIn = 60): Promise<string> {
  const client = getClient()
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, cmd, { expiresIn })
}
