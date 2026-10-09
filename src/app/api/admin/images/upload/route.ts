import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupportedImageMimeType,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/image-upload";

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function getR2Configuration() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim();

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicBaseUrl
  ) {
    return null;
  }

  let parsedPublicUrl: URL;
  try {
    parsedPublicUrl = new URL(publicBaseUrl);
  } catch {
    return null;
  }

  if (
    parsedPublicUrl.protocol !== "https:" ||
    parsedPublicUrl.username ||
    parsedPublicUrl.password ||
    parsedPublicUrl.search ||
    parsedPublicUrl.hash ||
    parsedPublicUrl.pathname !== "/" ||
    !/^[a-fA-F0-9]{32}$/.test(accountId) ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName)
  ) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: publicBaseUrl.endsWith("/")
      ? publicBaseUrl
      : `${publicBaseUrl}/`,
  };
}

async function readLimitedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) {
    return null;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_UPLOAD_BYTES) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  if (totalBytes === 0) {
    return null;
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return jsonError("This upload request is not allowed.", 403);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Sign in with an administrator account to upload images.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return jsonError("You do not have permission to upload images.", 403);
  }

  const configuration = getR2Configuration();
  if (!configuration) {
    return jsonError(
      "Image storage is not configured. Ask the site administrator to complete the Cloudflare R2 setup.",
      503
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return jsonError("Invalid upload size.", 400);
    }
    if (parsedLength > MAX_IMAGE_UPLOAD_BYTES) {
      return jsonError("Images must be 5 MB or smaller.", 413);
    }
  }

  const bytes = await readLimitedBody(request);
  if (!bytes) {
    return jsonError("Choose a non-empty image no larger than 5 MB.", 413);
  }

  const detectedType = await fileTypeFromBuffer(bytes);
  if (!detectedType || !isSupportedImageMimeType(detectedType.mime)) {
    return jsonError(
      "Use a JPEG, PNG, WebP, GIF or AVIF image. SVG and other file types are not accepted.",
      415
    );
  }

  const objectKey = `site-images/${randomUUID()}.${detectedType.ext}`;
  const publicUrl = new URL(
    objectKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/"),
    configuration.publicBaseUrl
  ).toString();
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: configuration.bucketName,
        Key: objectKey,
        Body: bytes,
        ContentLength: bytes.byteLength,
        ContentType: detectedType.mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (error) {
    console.error(
      "CLOUDFLARE R2 IMAGE UPLOAD FAILED:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return jsonError(
      "The image could not be saved to Cloudflare R2. Check the server configuration and try again.",
      502
    );
  } finally {
    client.destroy();
  }

  return Response.json(
    { url: publicUrl },
    { headers: { "Cache-Control": "no-store" } }
  );
}
