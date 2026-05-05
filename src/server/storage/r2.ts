import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error("R2 is not configured (missing R2_* env vars).");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

function bucket(): string {
  if (!env.R2_BUCKET) throw new Error("R2_BUCKET is not configured.");
  return env.R2_BUCKET;
}

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
  expiresIn: number;
};

export async function presignUpload(opts: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<PresignedUpload> {
  const expiresIn = opts.expiresIn ?? 60 * 5;
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn });
  const publicUrl = env.R2_PUBLIC_BASE_URL
    ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${opts.key}`
    : null;
  return { key: opts.key, uploadUrl, publicUrl, expiresIn };
}

export async function presignDownload(key: string, expiresIn = 60 * 10) {
  const cmd = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(client(), cmd, { expiresIn });
}

export async function putObject(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  );
  return {
    key: opts.key,
    publicUrl: env.R2_PUBLIC_BASE_URL
      ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${opts.key}`
      : null,
  };
}
